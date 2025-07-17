"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { arbitrum } from "viem/chains";
import {
    getSwapInputsFor,
    getTokenByAddress,
    getTokenByTicker,
    type Token,
} from "@/app/rampv2/token-registry";
import { NumberInput } from "@/components/number-input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { BalanceRow } from "../components/balance-row";
import { DepositSubmitButton } from "../components/deposit-submit-button";
import { MaxButton } from "../components/max-button";
import { ReviewRoute } from "../components/review-route";
import { TokenSelect } from "../components/token-select";
import { Intent } from "../core/intent";
import { TaskContext } from "../core/task-context";
import { buildBalancesCache, isETH } from "../helpers";
import { approveBufferQueryOptions } from "../queries/eth-buffer";
import { onChainBalanceQuery } from "../queries/on-chain-balance";
import { planQueryOptions } from "../queries/plan";
import type { TaskQueue } from "../queue/task-queue";
import { getDepositTokens } from "../token-registry/registry";
import type { RampEnv } from "../types";
import { ExternalTransferDirection } from "../types";

const direction = ExternalTransferDirection.Deposit;

interface Props {
    env: RampEnv;
    onQueueStart?: (queue: TaskQueue) => void;
    initialMint?: `0x${string}`;
}

export default function DepositForm({ env, onQueueStart, initialMint }: Props) {
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
    const [mint, setMint] = useState(initialMint ?? "");
    const [amount, setAmount] = useState("");

    // --- Token List --- //
    const availableTokens = getDepositTokens(currentChain);

    const swapToken: Token | undefined = useMemo(() => {
        const token = getTokenByAddress(mint, currentChain);
        if (token?.ticker === "USDC" && currentChain === arbitrum.id) {
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
            connection,
            mint,
            owner: address,
            wagmiConfig,
        }),
        enabled: !!mint,
    });

    const { data: availableSwapBalance } = useQuery({
        ...onChainBalanceQuery({
            chainId: currentChain,
            connection,
            mint: swapToken?.address!,
            owner: address,
            wagmiConfig,
        }),
        enabled: !!swapToken?.address,
    });

    const balances = buildBalancesCache({
        depositMint: mint,
        depositRaw: availableDepositBalance?.raw,
        network: currentChain,
        swapMint: swapToken?.address,
        swapRaw: availableSwapBalance?.raw,
    });

    // USD minimum validation now handled within DepositSubmitButton

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
                amount,
                chainId: currentChain,
                depositMint: USDC.address,
                swapToken: mint,
            });
        } else if (swapToken?.address && needsSwap) {
            intent = Intent.newSwapIntent(ctx, {
                amount,
                chainId: currentChain,
                depositMint: mint,
                swapToken: swapToken.address,
            });
        } else {
            // Default case: deposit directly
            intent = Intent.newDepositIntent(ctx, {
                amount,
                chainId: currentChain,
                mint,
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

    const { data: plan, status } = useQuery(planQueryOptions({ intent, taskCtx }));

    const { data: minRemainingEthBalance } = useQuery({
        ...approveBufferQueryOptions({
            approvals: 100,
            chainId: currentChain,
            config: wagmiConfig,
        }),
        enabled: swapToken ? isETH(swapToken.address, currentChain) : false,
    });

    const tasks = plan?.tasks;
    const route = plan?.route;

    // removed redundant balance and label checks; handled by DepositSubmitButton

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
                        chainId={currentChain}
                        connection={connection}
                        direction={direction}
                        onChange={setMint}
                        owner={address}
                        renegadeConfig={renegadeConfig}
                        tokens={availableTokens}
                        value={mint}
                        wagmiConfig={wagmiConfig}
                    />
                </div>

                {/* Amount input */}
                <div className="flex flex-col gap-2">
                    <Label>Amount</Label>
                    <div className="relative">
                        <NumberInput
                            className="pr-12 rounded-none font-mono"
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            value={amount}
                        />
                        <MaxButton
                            chainId={currentChain}
                            connection={connection}
                            direction={direction}
                            mint={mint}
                            onClick={setAmount}
                            owner={address}
                            renegadeConfig={renegadeConfig}
                            wagmiConfig={wagmiConfig}
                        />
                    </div>
                </div>

                {/* Balances */}
                <div
                    className={cn("flex flex-col gap-2", {
                        hidden: !mint,
                    })}
                >
                    <BalanceRow
                        chainId={currentChain}
                        connection={connection}
                        direction={direction}
                        mint={mint}
                        onClick={setAmount}
                        owner={address}
                        renegadeConfig={renegadeConfig}
                        showZero
                        wagmiConfig={wagmiConfig}
                    />

                    {swapToken?.address && (
                        <BalanceRow
                            chainId={currentChain}
                            connection={connection}
                            direction={direction}
                            hideNetworkLabel
                            key={swapToken.address}
                            minRemainingEthBalance={minRemainingEthBalance}
                            mint={swapToken.address}
                            onClick={handleSetCombinedAmount}
                            owner={address}
                            renegadeConfig={renegadeConfig}
                            wagmiConfig={wagmiConfig}
                        />
                    )}
                </div>

                {/* Review Route Panel */}
                {intent?.needsRouting() ? (
                    <ReviewRoute intent={intent} route={route} status={status} />
                ) : null}
            </div>

            {/* Submit */}
            <DepositSubmitButton
                amount={amount}
                balances={balances}
                chainId={currentChain}
                intent={intent}
                mint={mint}
                onQueueStart={onQueueStart}
                renegadeConfig={renegadeConfig}
                route={route}
                status={status}
                tasks={tasks}
            />
        </>
    );
}
