"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { mainnet } from "viem/chains";

import { getAllBridgeableTokens } from "@/app/rampv2/token-registry/registry";
import { NumberInput } from "@/components/number-input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MaintenanceButtonWrapper } from "@/components/ui/maintenance-button-wrapper";
import { solana } from "@/lib/viem";
import { BalanceRow } from "../components/balance-row";
import { MaxButton } from "../components/max-button";
import { NetworkSelect } from "../components/network-select";
import { ReviewRoute } from "../components/review-route";
import { TokenSelect } from "../components/token-select";
import { Intent } from "../core/intent";
import { TaskContext } from "../core/task-context";
import { buildBalancesCache } from "../helpers";
import { planTasks } from "../planner/task-planner";
import { onChainBalanceQuery } from "../queries/on-chain-balance";
import type { TaskQueue as TaskQueueType } from "../queue/task-queue";
import { TaskQueue } from "../queue/task-queue";
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
            mint,
            owner: chainDependentAddress!,
            wagmiConfig,
            connection,
        }),
        enabled: !!mint && !!chainDependentAddress,
    });

    const balances = useMemo(
        () =>
            buildBalancesCache({
                network,
                depositMint: mint,
                depositRaw: availableDepositBalance?.raw,
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

        const intent = Intent.newBridgeIntent(ctx, {
            mint,
            sourceChain: network,
            currentChain,
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
        mint,
        network,
        currentChain,
        amount,
    ]);

    const { data: plan, status } = useQuery({
        queryKey: ["ramp-bridge", { ...intent?.toJson?.() }],
        queryFn: () => {
            if (!intent || !taskCtx) return undefined;
            return planTasks(intent, taskCtx);
        },
        enabled: !!intent && !!taskCtx && Object.keys(balances).length > 0,
    });

    const tasks = plan?.tasks;
    const route = plan?.route;

    function handleSubmit() {
        if (!tasks || tasks.length === 0) return;
        const queue = new TaskQueue(tasks);
        if (onQueueStart) {
            onQueueStart(queue);
        } else {
            queue.run().catch(console.error);
        }
    }

    // Parent page guarantees evmAddress; if route requires solana and it's missing, show banner.
    if (network === solana.id && !solanaAddress) {
        return (
            <p className="p-4 text-center text-muted-foreground">
                Connect a Solana wallet to bridge from Solana.
            </p>
        );
    }

    return (
        <>
            <div className="space-y-6 p-6">
                {/* Network selector */}
                <div className="flex flex-col gap-2">
                    <Label>Network</Label>
                    <NetworkSelect
                        value={network}
                        onChange={setNetwork}
                        networks={availableNetworks}
                        disabledNetworks={disabledNetworks}
                    />
                </div>

                {/* Token selector */}
                <div className="flex flex-col gap-2">
                    <Label>Token</Label>
                    <TokenSelect
                        isBridge
                        tokens={availableTokens}
                        direction={direction}
                        value={mint}
                        onChange={setMint}
                        chainId={network}
                        owner={chainDependentAddress!}
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
                            chainId={network}
                            mint={mint}
                            owner={chainDependentAddress!}
                            wagmiConfig={wagmiConfig}
                            connection={connection}
                            onClick={setAmount}
                        />
                    </div>
                </div>

                {/* Balances */}
                <BalanceRow
                    chainId={network}
                    mint={mint}
                    owner={chainDependentAddress!}
                    wagmiConfig={wagmiConfig}
                    renegadeConfig={renegadeConfig}
                    connection={connection}
                    onClick={setAmount}
                    direction={direction}
                    showZero
                />

                {/* Review Route Panel */}
                {intent ? <ReviewRoute intent={intent} route={route} status={status} /> : null}
            </div>
            {/* Submit */}
            <div className="w-full flex">
                <MaintenanceButtonWrapper messageKey="transfer" triggerClassName="flex-1">
                    <Button
                        className="w-full flex-1 border-0 border-t font-extended text-2xl"
                        size="xl"
                        type="submit"
                        variant="outline"
                        onClick={handleSubmit}
                        disabled={status !== "success"}
                    >
                        Bridge & Deposit
                    </Button>
                </MaintenanceButtonWrapper>
            </div>
        </>
    );
}
