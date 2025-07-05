"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { getAllTokens, getSwapInputsFor, type Token } from "@/app/rampv2/token-registry";
import { ExternalTransferDirection } from "@/components/dialogs/transfer/helpers";
import { NumberInput } from "@/components/number-input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MaintenanceButtonWrapper } from "@/components/ui/maintenance-button-wrapper";
import { BalanceRow } from "../components/balance-row";
import { MaxButton } from "../components/max-button";
import { ReviewRoute } from "../components/review-route";
import { TokenSelect } from "../components/token-select";
import { Intent } from "../core/intent";
import { TaskContext } from "../core/task-context";
import { buildBalancesCache, isETH, isWrap } from "../helpers";
import { planTasks } from "../planner/task-planner";
import { approveBufferQueryOptions } from "../queries/eth-buffer";
import { onChainBalanceQuery } from "../queries/on-chain-balance";
import { TaskQueue } from "../queue/task-queue";
import type { RampEnv } from "../types";

const direction = ExternalTransferDirection.Deposit;

interface Props {
    env: RampEnv;
    onQueueStart?: (queue: TaskQueue) => void;
}

export default function DepositForm({ env, onQueueStart }: Props) {
    const {
        renegadeConfig,
        wagmiConfig,
        connection,
        keychainNonce,
        currentChain,
        evmAddress: address,
        solanaAddress,
        solanaSignTx,
    } = env;

    // --- Local State --- //
    // Token to deposit
    const [mint, setMint] = useState("");
    // Token to swap into mint
    const [swapToken, setSwapToken] = useState<string>("");
    const [amount, setAmount] = useState("");

    // --- Token List --- //
    const availableTokens = useMemo(() => getAllTokens(currentChain), [currentChain]);

    const availableSwapToken: Token | undefined = useMemo(
        () => getSwapInputsFor(mint, currentChain)[0],
        [mint, currentChain],
    );
    console.log("🚀 ~ DepositForm ~ availableSwapToken:", availableSwapToken);

    // --- On-chain Balances --- //
    const { data: availableDepositBalance } = useQuery({
        ...onChainBalanceQuery({
            chainId: currentChain,
            mint,
            owner: address,
            wagmiConfig,
            connection,
        }),
        enabled: !!mint,
    });

    const { data: availableSwapBalance } = useQuery({
        ...onChainBalanceQuery({
            chainId: currentChain,
            mint: swapToken ?? "",
            owner: address,
            wagmiConfig,
            connection,
        }),
        enabled: !!swapToken,
    });

    const balances = useMemo(
        () =>
            buildBalancesCache({
                network: currentChain,
                depositMint: mint,
                depositRaw: availableDepositBalance?.raw,
                swapMint: swapToken,
                swapRaw: availableSwapBalance?.raw,
            }),
        [currentChain, mint, swapToken, availableDepositBalance?.raw, availableSwapBalance?.raw],
    );

    // --- Intent & Task Planning --- //
    const { intent, taskCtx } = useMemo(() => {
        if (!renegadeConfig || !wagmiConfig || !address)
            return { intent: undefined, taskCtx: undefined } as const;

        const ctx = TaskContext.new(
            renegadeConfig,
            wagmiConfig,
            keychainNonce ?? BigInt(0),
            connection,
            solanaSignTx ?? undefined,
            solanaAddress ?? undefined,
            balances,
        );

        const intent = Intent.newSwapIntent(ctx, {
            swapToken,
            depositMint: mint,
            chainId: currentChain,
            amount,
        });

        return { intent, taskCtx: ctx } as const;
    }, [
        renegadeConfig,
        wagmiConfig,
        address,
        keychainNonce,
        connection,
        solanaSignTx,
        solanaAddress,
        balances,
        swapToken,
        mint,
        currentChain,
        amount,
    ]);

    const { data: plan, status } = useQuery({
        queryKey: ["ramp-deposit", { ...intent?.toJson?.() }],
        queryFn: () => {
            if (!intent || !taskCtx || !intent.amountAtomic) return undefined;
            return planTasks(intent, taskCtx);
        },
        enabled: !!intent && !!taskCtx && Object.keys(balances).length > 0,
        staleTime: 0,
    });

    const { data: minRemainingEthBalance } = useQuery({
        ...approveBufferQueryOptions({
            config: wagmiConfig,
            chainId: currentChain,
            approvals: 100,
        }),
        enabled: swapToken ? isETH(swapToken, currentChain) : false,
    });

    const tasks = plan?.tasks;
    const route = plan?.route;

    const submitLabel = useMemo(() => {
        if (!route) return "Deposit";
        return isWrap(route) ? "Wrap & Deposit" : "Swap & Deposit";
    }, [route]);

    function handleSubmit() {
        if (!tasks || tasks.length === 0) return;
        const queue = new TaskQueue(tasks);
        if (onQueueStart) {
            onQueueStart(queue);
        } else {
            // Fallback: run internally if no handler provided
            queue.run().catch(console.error);
        }
    }

    function handleSetCombinedAmount(tokenAmount: string) {
        const amt = Number(tokenAmount);
        const availableBalance = Number(availableDepositBalance?.decimalCorrected);
        const combined = amt + availableBalance;
        setAmount(combined.toString());
    }

    return (
        <div className="space-y-6 pt-6">
            {/* Token selector */}
            <div className="flex flex-col gap-2">
                <Label>Token</Label>
                <TokenSelect
                    tokens={availableTokens}
                    direction={direction}
                    value={mint}
                    onChange={setMint}
                    chainId={currentChain}
                    owner={address}
                    wagmiConfig={wagmiConfig}
                    connection={connection}
                    renegadeConfig={renegadeConfig}
                />
            </div>

            {/* Amount input */}
            <div className="flex flex-col gap-2">
                <Label>Amount</Label>
                <div className="relative">
                    <NumberInput
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="pr-12 rounded-none font-mono"
                    />
                    <MaxButton
                        chainId={currentChain}
                        mint={mint}
                        owner={address}
                        wagmiConfig={wagmiConfig}
                        connection={connection}
                        onClick={setAmount}
                    />
                </div>
            </div>

            {/* Balances */}
            <div>
                <BalanceRow
                    chainId={currentChain}
                    mint={mint}
                    direction={direction}
                    owner={address}
                    wagmiConfig={wagmiConfig}
                    renegadeConfig={renegadeConfig}
                    connection={connection}
                    onClick={setAmount}
                />

                {availableSwapToken && (
                    <BalanceRow
                        key={availableSwapToken.address}
                        chainId={currentChain}
                        mint={availableSwapToken.address}
                        direction={direction}
                        owner={address}
                        wagmiConfig={wagmiConfig}
                        renegadeConfig={renegadeConfig}
                        connection={connection}
                        onClick={(value) => {
                            setSwapToken(availableSwapToken.address);
                            handleSetCombinedAmount(value);
                        }}
                        hideNetworkLabel
                        minRemainingEthBalance={minRemainingEthBalance}
                    />
                )}
            </div>

            {/* Review Route Panel */}
            {route ? <ReviewRoute route={route} /> : null}

            {/* Submit */}
            <div className="w-full flex">
                <MaintenanceButtonWrapper messageKey="transfer" triggerClassName="flex-1">
                    <Button
                        className="flex-1 border-0 border-t font-extended text-2xl"
                        size="xl"
                        type="submit"
                        variant="outline"
                        onClick={handleSubmit}
                        disabled={status !== "success"}
                    >
                        {submitLabel}
                    </Button>
                </MaintenanceButtonWrapper>
            </div>
        </div>
    );
}
