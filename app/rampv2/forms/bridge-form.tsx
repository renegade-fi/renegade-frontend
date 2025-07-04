"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { arbitrum, base, mainnet } from "viem/chains";
import { useAccount, useConfig as useWagmiConfig } from "wagmi";

import { getAllBridgeableTokens } from "@/app/rampv2/token-registry/registry";
import { ExternalTransferDirection } from "@/components/dialogs/transfer/helpers";
import { NumberInput } from "@/components/number-input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MaintenanceButtonWrapper } from "@/components/ui/maintenance-button-wrapper";
import { useBackOfQueueWallet } from "@/hooks/query/use-back-of-queue-wallet";
import { solana } from "@/lib/viem";
import { useCurrentChain, useConfig as useRenegadeConfig } from "@/providers/state-provider/hooks";

import { BalanceRow } from "../components/balance-row";
import { MaxButton } from "../components/max-button";
import { NetworkSelect } from "../components/network-select";
import { TokenSelect } from "../components/token-select";
import { TaskContext } from "../core/task-context";
import { createBridgeIntent } from "../helpers";
import { planTasks } from "../planner/task-planner";
import { onChainBalanceQuery } from "../queries/on-chain-balance";
import { TaskQueue } from "../queue/task-queue";
import { buildBalancesCache } from "../utils/balances";

const direction = ExternalTransferDirection.Deposit;

export default function BridgeForm() {
    const renegadeConfig = useRenegadeConfig();
    const wagmiConfig = useWagmiConfig();
    const currentChain = useCurrentChain();
    const { address } = useAccount();

    const { data: keychainNonce } = useBackOfQueueWallet({
        query: { select: (w) => w.key_chain.nonce },
    });

    const { connection } = useConnection();
    const { signTransaction, publicKey } = useWallet();
    const solanaAddress = publicKey ? publicKey.toBase58() : undefined;

    // ---- Local state ------------------------------------------------------
    const [bridgeNetwork, setBridgeNetwork] = useState<number>(mainnet.id);
    const [mint, setMint] = useState("");
    const [amount, setAmount] = useState("");

    // -----------------------------------------------------------------------
    const network = bridgeNetwork;

    // Token list based on selected bridge network
    const availableTokens = useMemo(() => getAllBridgeableTokens(network), [network]);

    // Networks that can be bridged from (exclude currentChain)
    const availableNetworks = useMemo(() => {
        return [solana.id, mainnet.id, arbitrum.id, base.id].filter((id) => id !== currentChain);
    }, [currentChain]);

    const chainDependentAddress = (network as number) === solana.id ? solanaAddress : address;

    // -----------------------------------------------------------------------
    const { data: availableDepositBalance } = useQuery({
        ...onChainBalanceQuery({
            chainId: network,
            mint,
            owner: chainDependentAddress!,
            config: wagmiConfig,
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
            signTransaction ?? undefined,
            solanaAddress,
            balances,
        );

        const intent = createBridgeIntent(ctx, {
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
        signTransaction,
        solanaAddress,
        balances,
        mint,
        network,
        currentChain,
        amount,
    ]);

    const { data: tasks, status } = useQuery({
        queryKey: ["ramp-bridge", { ...intent?.toJson?.() }],
        queryFn: () => {
            if (!intent || !taskCtx || !intent.amountAtomic) return undefined;
            return planTasks(intent, taskCtx);
        },
        enabled: !!intent && !!taskCtx && !!intent.amountAtomic && Object.keys(balances).length > 0,
    });

    function handleSubmit() {
        if (!tasks) return;
        const queue = new TaskQueue(tasks);
        queue.run();
    }

    if (!renegadeConfig || !chainDependentAddress) {
        return null; // Parent component shows the connect-wallet message.
    }

    return (
        <div className="space-y-6 pt-6">
            {/* Network selector */}
            <div className="flex flex-col gap-2">
                <Label>Network</Label>
                <NetworkSelect
                    value={bridgeNetwork}
                    onChange={setBridgeNetwork}
                    networks={availableNetworks}
                />
            </div>

            {/* Token selector */}
            <div className="flex flex-col gap-2">
                <Label>Token</Label>
                <TokenSelect
                    tokens={availableTokens}
                    direction={direction}
                    value={mint}
                    onChange={setMint}
                    chainId={network}
                    owner={chainDependentAddress}
                    config={wagmiConfig}
                    connection={connection}
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
                        owner={chainDependentAddress}
                        config={wagmiConfig}
                        connection={connection}
                        onClick={setAmount}
                    />
                </div>
            </div>

            {/* Balances */}
            <BalanceRow
                chainId={network}
                mint={mint}
                owner={chainDependentAddress}
                config={wagmiConfig}
                connection={connection}
                onClick={setAmount}
            />

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
                        Bridge
                    </Button>
                </MaintenanceButtonWrapper>
            </div>
        </div>
    );
}
