"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useAccount, useConfig as useWagmiConfig } from "wagmi";

import { getAllTokens, getSwapInputsFor } from "@/app/rampv2/token-registry";
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
import { TokenSelect } from "../components/token-select";
import { makeTaskContext } from "../core/make-task-context";
import { createSwapIntent, isETH } from "../helpers";
import { planTasks } from "../planner/task-planner";
import { approveBufferQueryOptions } from "../queries/eth-buffer";
import { onChainBalanceQuery } from "../queries/on-chain-balance";
import { TaskQueue } from "../queue/task-queue";
import { buildBalancesCache } from "../utils/balances";

const direction = ExternalTransferDirection.Deposit;

export default function DepositForm() {
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
    const [mint, setMint] = useState("");
    const [amount, setAmount] = useState("");

    // -----------------------------------------------------------------------
    const network = currentChain;

    // Token list based on current chain
    const availableTokens = useMemo(() => getAllTokens(currentChain), [currentChain]);

    const availableSwappableTokens = useMemo(
        () => getSwapInputsFor(mint, network),
        [mint, network],
    );

    const swapToken = availableSwappableTokens[0]?.address;

    const chainDependentAddress = (network as number) === solana.id ? solanaAddress : address;

    // On-chain balances ------------------------------------------------------
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

    const { data: availableSwapBalance } = useQuery({
        ...onChainBalanceQuery({
            chainId: network,
            mint: swapToken ?? "",
            owner: chainDependentAddress!,
            config: wagmiConfig,
            connection,
        }),
        enabled: !!swapToken && !!chainDependentAddress,
    });

    const balances = useMemo(
        () =>
            buildBalancesCache({
                network,
                depositMint: mint,
                depositRaw: availableDepositBalance?.raw,
                swapMint: swapToken,
                swapRaw: availableSwapBalance?.raw,
            }),
        [network, mint, swapToken, availableDepositBalance?.raw, availableSwapBalance?.raw],
    );

    const { intent, taskCtx } = useMemo(() => {
        if (!renegadeConfig || !wagmiConfig || !address)
            return { intent: undefined, taskCtx: undefined } as const;

        const ctx = makeTaskContext(
            renegadeConfig,
            wagmiConfig,
            keychainNonce ?? BigInt(0),
            connection,
            signTransaction ?? undefined,
            solanaAddress,
            balances,
        );

        if (!swapToken) return { intent: undefined, taskCtx: ctx } as const;

        const intent = createSwapIntent(ctx, {
            swapToken,
            depositMint: mint,
            chainId: network,
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
        swapToken,
        mint,
        network,
        amount,
    ]);

    const { data: tasks, status } = useQuery({
        queryKey: ["ramp-deposit", { ...intent?.toJson?.() }],
        queryFn: () => {
            if (!intent || !taskCtx || !intent.amountAtomic) return undefined;
            return planTasks(intent, taskCtx);
        },
        enabled: !!intent && !!taskCtx && !!intent.amountAtomic && Object.keys(balances).length > 0,
        staleTime: 0,
    });

    const { data: minRemainingEthBalance } = useQuery({
        ...approveBufferQueryOptions({
            config: wagmiConfig,
            chainId: currentChain,
            approvals: 100,
        }),
        enabled: isETH(swapToken, network),
    });

    function handleSubmit() {
        if (!tasks) return;
        const queue = new TaskQueue(tasks);
        queue.run();
    }

    function handleSetCombinedAmount(tokenAmount: string) {
        const amt = Number(tokenAmount);
        const availableBalance = Number(availableDepositBalance?.decimalCorrected);
        const combined = amt + availableBalance;
        setAmount(combined.toString());
    }

    if (!renegadeConfig || !chainDependentAddress) {
        return null; // Parent handles connect-wallet UI.
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
            <div>
                <BalanceRow
                    chainId={network}
                    mint={mint}
                    owner={chainDependentAddress}
                    config={wagmiConfig}
                    connection={connection}
                    onClick={setAmount}
                />

                {availableSwappableTokens.length > 0 ? (
                    <BalanceRow
                        chainId={network}
                        mint={availableSwappableTokens[0].address}
                        owner={chainDependentAddress}
                        config={wagmiConfig}
                        connection={connection}
                        onClick={handleSetCombinedAmount}
                        hideNetworkLabel
                        minRemainingEthBalance={minRemainingEthBalance}
                    />
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
                        disabled={status !== "success"}
                    >
                        Deposit
                    </Button>
                </MaintenanceButtonWrapper>
            </div>
        </div>
    );
}
