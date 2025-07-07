"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
    getSwapInputsFor,
    getTokenByAddress,
    getTokenByTicker,
    type Token,
} from "@/app/rampv2/token-registry";
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
import { getDepositTokens } from "../token-registry/registry";
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
    // const [swapToken, setSwapToken] = useState<string>();
    // const swapToken:string  | undefined = getSwapInputsFor(mint, currentChain)?.[0]?.address;
    const [amount, setAmount] = useState("");

    // --- Token List --- //
    const availableTokens = getDepositTokens(currentChain);

    const swapToken: Token | undefined = useMemo(() => {
        const token = getTokenByAddress(mint, currentChain);
        if (token?.ticker === "USDC") {
            const USDCe = getTokenByTicker("USDC.e", currentChain);
            if (!USDCe) throw new Error("USDC.e not found");
            return USDCe;
        }
        const inputs = getSwapInputsFor(mint, currentChain);
        if (inputs.length === 0) return undefined;
        return inputs[0];
    }, [mint, currentChain]);

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
            mint: swapToken?.address!,
            owner: address,
            wagmiConfig,
            connection,
        }),
        enabled: !!swapToken?.address,
    });

    const balances = buildBalancesCache({
        network: currentChain,
        depositMint: mint,
        depositRaw: availableDepositBalance?.raw,
        swapMint: swapToken?.address,
        swapRaw: availableSwapBalance?.raw,
    });

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

        const needsSwap =
            swapToken?.address &&
            Number(amount) > Number(availableDepositBalance?.decimalCorrected);

        let intent: Intent | undefined;

        const token = getTokenByAddress(mint, currentChain);
        // Special case for USDT - swap to USDC
        if (token?.ticker === "USDT") {
            const USDC = getTokenByTicker("USDC", currentChain);
            if (!USDC) throw new Error("USDC not found");
            intent = Intent.newSwapIntent(ctx, {
                swapToken: mint,
                depositMint: USDC.address,
                chainId: currentChain,
                amount,
            });
        } else if (swapToken?.address && needsSwap) {
            intent = Intent.newSwapIntent(ctx, {
                swapToken: swapToken.address,
                depositMint: mint,
                chainId: currentChain,
                amount,
            });
        } else {
            // Default case: deposit directly
            intent = Intent.newDepositIntent(ctx, {
                mint,
                chainId: currentChain,
                amount,
            });
        }

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
        availableDepositBalance?.decimalCorrected,
    ]);

    const { data: plan, status } = useQuery({
        queryKey: ["ramp-deposit", { ...intent?.toJson?.() }],
        queryFn: () => {
            if (!intent || !taskCtx) return undefined;
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
        enabled: swapToken ? isETH(swapToken.address, currentChain) : false,
    });

    const tasks = plan?.tasks;
    const route = plan?.route;

    // Helper to determine the submit button label based on the planned route.
    function getSubmitLabel(routeParam: typeof route): string {
        if (!routeParam) return "Deposit";
        return isWrap(routeParam) ? "Wrap & Deposit" : "Swap & Deposit";
    }

    const submitLabel = getSubmitLabel(route);

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
        <>
            <div className="space-y-6 p-6">
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
                <div className="flex flex-col gap-2">
                    <BalanceRow
                        chainId={currentChain}
                        mint={mint}
                        direction={direction}
                        owner={address}
                        wagmiConfig={wagmiConfig}
                        renegadeConfig={renegadeConfig}
                        connection={connection}
                        onClick={setAmount}
                        allowZero
                    />

                    {swapToken?.address && (
                        <BalanceRow
                            key={swapToken.address}
                            chainId={currentChain}
                            mint={swapToken.address}
                            direction={direction}
                            owner={address}
                            wagmiConfig={wagmiConfig}
                            renegadeConfig={renegadeConfig}
                            connection={connection}
                            onClick={(value) => {
                                // setSwapToken(availableSwapToken.address);
                                handleSetCombinedAmount(value);
                            }}
                            hideNetworkLabel
                            minRemainingEthBalance={minRemainingEthBalance}
                        />
                    )}
                </div>

                {/* Review Route Panel */}
                {intent?.needsRouting() ? (
                    <ReviewRoute intent={intent} route={route} status={status} />
                ) : null}
            </div>

            {/* Submit */}
            <div className="w-full flex">
                <MaintenanceButtonWrapper messageKey="transfer" triggerClassName="flex-1">
                    <Button
                        className="flex-1 border-0 border-t font-extended text-2xl"
                        size="xl"
                        type="submit"
                        variant="outline"
                        onClick={handleSubmit}
                        disabled={intent?.needsRouting() ? status !== "success" : false}
                    >
                        {submitLabel}
                    </Button>
                </MaintenanceButtonWrapper>
            </div>
        </>
    );
}
