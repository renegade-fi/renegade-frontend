"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { mainnet } from "viem/chains";

import { getAllBridgeableTokens, getBridgeTargetToken } from "@/app/rampv2/token-registry/registry";
import { NumberInput } from "@/components/number-input";
import { Label } from "@/components/ui/label";
import { solana } from "@/lib/viem";
import { BalanceRow } from "../components/balance-row";
import { BridgeSubmitButton } from "../components/bridge-submit-button";
import { MaxButton } from "../components/max-button";
import { NetworkSelect } from "../components/network-select";
import { ReviewRoute } from "../components/review-route";
import { TokenSelect } from "../components/token-select";
import { Intent } from "../core/intent";
import { TaskContext } from "../core/task-context";
import { buildBalancesCache } from "../helpers";
import { onChainBalanceQuery } from "../queries/on-chain-balance";
import { planQueryOptions } from "../queries/plan";
import type { TaskQueue as TaskQueueType } from "../queue/task-queue";
import type { RampEnv } from "../types";
import { ExternalTransferDirection } from "../types";

const direction = ExternalTransferDirection.Deposit;

interface Props {
    env: RampEnv;
    onQueueStart?: (queue: TaskQueueType) => void;
}

export default function BridgeForm({ env, onQueueStart }: Props) {
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

    const [network, setNetwork] = useState<number>(mainnet.id);
    const [mint, setMint] = useState("");
    const [amount, setAmount] = useState("");

    // biome-ignore lint/correctness/useExhaustiveDependencies: <reset mint on network change>
    useEffect(() => {
        setMint("");
    }, [network]);

    // Token list based on selected bridge network
    const availableTokens = useMemo(() => getAllBridgeableTokens(network), [network]);

    // Networks that can be bridged from (exclude currentChain)
    // If user lacks a connected Solana wallet, show Solana as disabled.
    const { availableNetworks, disabledNetworks } = useMemo(() => {
        // Always consider these EVM chains as potentially enabled.
        const baseNetworks: number[] = [mainnet.id];

        const enabled: number[] = baseNetworks.filter((id) => id !== currentChain);
        const disabled: number[] = [];

        // Handle Solana separately so we can disable when no wallet is connected.
        if (solana.id !== currentChain) {
            if (solanaAddress) enabled.push(solana.id);
            else disabled.push(solana.id);
        }

        return { availableNetworks: enabled, disabledNetworks: disabled } as const;
    }, [currentChain, solanaAddress]);

    const chainDependentAddress = network === solana.id ? (solanaAddress ?? undefined) : address;

    const { data: availableDepositBalance } = useQuery({
        ...onChainBalanceQuery({
            chainId: network,
            connection,
            mint,
            owner: chainDependentAddress!,
            wagmiConfig,
        }),
        enabled: !!mint && !!chainDependentAddress,
    });

    // Get target token for the bridge
    const targetMint = mint ? getBridgeTargetToken(mint, network, currentChain) : undefined;

    const balances = useMemo(
        () =>
            buildBalancesCache({
                depositMint: mint,
                depositRaw: availableDepositBalance?.raw,
                network,
            }),
        [network, mint, availableDepositBalance?.raw],
    );

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

        const sourceMint = mint;
        const targetMint = getBridgeTargetToken(sourceMint, network, currentChain);
        if (!targetMint) return { intent: undefined, taskCtx: undefined } as const;

        const intent = Intent.newBridgeIntent(ctx, {
            amount,
            sourceChain: network,
            sourceMint,
            targetChain: currentChain,
            targetMint,
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
        mint,
        network,
        currentChain,
        amount,
    ]);

    const { data: plan, status } = useQuery(planQueryOptions({ intent, taskCtx }));

    const tasks = plan?.tasks;
    const route = plan?.route;

    return (
        <>
            <div className="space-y-6 p-6">
                {/* Network selector */}
                <div className="flex flex-col gap-2">
                    <Label>Network</Label>
                    <NetworkSelect
                        disabledNetworks={disabledNetworks}
                        networks={availableNetworks}
                        onChange={setNetwork}
                        value={network}
                    />
                </div>

                {/* Token selector */}
                <div className="flex flex-col gap-2">
                    <Label>Token</Label>
                    <TokenSelect
                        chainId={network}
                        connection={connection}
                        direction={direction}
                        isBridge
                        onChange={setMint}
                        owner={chainDependentAddress!}
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
                            chainId={network}
                            connection={connection}
                            direction={direction}
                            mint={mint}
                            onClick={setAmount}
                            owner={chainDependentAddress!}
                            renegadeConfig={renegadeConfig}
                            wagmiConfig={wagmiConfig}
                        />
                    </div>
                </div>

                {/* Balances */}
                <BalanceRow
                    chainId={network}
                    connection={connection}
                    direction={direction}
                    mint={mint}
                    onClick={setAmount}
                    owner={chainDependentAddress!}
                    renegadeConfig={renegadeConfig}
                    showZero
                    wagmiConfig={wagmiConfig}
                />

                {/* Review Route Panel */}
                {intent ? <ReviewRoute intent={intent} route={route} status={status} /> : null}
            </div>
            {/* Submit */}
            <BridgeSubmitButton
                balances={balances}
                connection={connection}
                intent={intent}
                onQueueStart={onQueueStart}
                renegadeConfig={renegadeConfig}
                route={route}
                solanaAddress={solanaAddress}
                status={status}
                targetMint={targetMint}
                tasks={tasks}
            />
        </>
    );
}
