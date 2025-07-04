"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { arbitrum, base, mainnet } from "viem/chains";
import { useAccount, useConfig as useWagmiConfig } from "wagmi";
import { getAllBridgeableTokens, getSwapInputsFor } from "@/app/rampv2/token-registry/registry";
import { ExternalTransferDirection } from "@/components/dialogs/transfer/helpers";
import { NumberInput } from "@/components/number-input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MaintenanceButtonWrapper } from "@/components/ui/maintenance-button-wrapper";
import { useBackOfQueueWallet } from "@/hooks/query/use-back-of-queue-wallet";
import { cn } from "@/lib/utils";
import { solana } from "@/lib/viem";
import { useCurrentChain, useConfig as useRenegadeConfig } from "@/providers/state-provider/hooks";
import { BalanceRow } from "./components/balance-row";
import { MaxButton } from "./components/max-button";
import { NetworkSelect } from "./components/network-select";
import { TokenSelect } from "./components/token-select";
import { balanceKey } from "./core/balance-utils";
import { makeTaskContext } from "./core/make-task-context";
import { createBridgeIntent, createSwapIntent } from "./helpers";
import { planTasks } from "./planner/task-planner";
import { onChainBalanceQuery } from "./queries/on-chain-balance";
import { TaskQueue } from "./queue/task-queue";
import { getAllTokens, type Token } from "./token-registry";

const direction = ExternalTransferDirection.Deposit;

export default function RampV2Page() {
    const renegadeConfig = useRenegadeConfig();
    const wagmiConfig = useWagmiConfig();
    const currentChain = useCurrentChain();
    const { address } = useAccount();

    const { data: keychainNonce } = useBackOfQueueWallet({
        query: { select: (w) => w.key_chain.nonce },
    });

    // Solana hooks
    const { connection } = useConnection();
    const { signTransaction, publicKey } = useWallet();
    const solanaAddress = publicKey ? publicKey.toBase58() : undefined;

    // Whether to bridge -> deposit or swap -> deposit
    const [isBridge, setIsBridge] = useState(false);
    // Network to use when bridging
    const [bridgeNetwork, setBridgeNetwork] = useState<number>(mainnet.id);
    // Network value that is always correct based on onramp mode
    const network = isBridge ? bridgeNetwork : currentChain;

    // Mint to deposit
    const [mint, setMint] = useState("");
    // Amount to deposit
    const [amount, setAmount] = useState("");

    // Derive token list based on network selection
    const availableTokens = useMemo<Token[]>(() => {
        if (isBridge) {
            return getAllBridgeableTokens(network);
        }
        return getAllTokens(currentChain);
    }, [currentChain, isBridge, network]);

    const availableSwappableTokens = useMemo<Token[]>(() => {
        if (isBridge) return [];
        return getSwapInputsFor(mint, network);
    }, [isBridge, mint, network]);

    // First candidate swap token (if any)
    const swapToken = availableSwappableTokens[0]?.address;

    // Networks that can be bridged from
    const availableNetworks = useMemo(() => {
        return [solana.id, mainnet.id, arbitrum.id, base.id].filter((id) => id !== currentChain);
    }, [currentChain]);

    const chainDependentAddress = network === solana.id ? solanaAddress : address;

    const { data: availableDepositBalance } = useQuery({
        ...onChainBalanceQuery({
            chainId: network,
            mint,
            owner: chainDependentAddress!,
            config: wagmiConfig,
            connection,
        }),
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

    // Build balances cache – MUST come before we build task context
    const balances = useMemo<Record<string, bigint>>(() => {
        const cache: Record<string, bigint> = {};
        if (mint) {
            cache[balanceKey(network, mint)] = availableDepositBalance?.raw ?? BigInt(0);
        }
        if (swapToken) {
            cache[balanceKey(network, swapToken)] = availableSwapBalance?.raw ?? BigInt(0);
        }
        return cache;
    }, [network, mint, swapToken, availableDepositBalance?.raw, availableSwapBalance?.raw]);

    const { intent, taskCtx } = useMemo(() => {
        if (!renegadeConfig || !wagmiConfig || !address)
            return { intent: undefined, taskCtx: undefined };
        const ctx = makeTaskContext(
            renegadeConfig,
            wagmiConfig,
            keychainNonce ?? BigInt(0),
            connection,
            signTransaction ?? undefined,
            solanaAddress,
            balances,
        );
        let intent;
        if (isBridge) {
            intent = createBridgeIntent(ctx, {
                mint,
                sourceChain: network,
                currentChain,
                amount,
            });
        } else {
            if (!swapToken) return { intent: undefined, taskCtx: ctx };
            intent = createSwapIntent(ctx, {
                swapToken,
                depositMint: mint,
                chainId: network,
                amount,
            });
        }
        return {
            intent,
            taskCtx: ctx,
        };
    }, [
        address,
        currentChain,
        network,
        mint,
        amount,
        renegadeConfig,
        wagmiConfig,
        keychainNonce,
        connection,
        signTransaction,
        solanaAddress,
        balances,
        isBridge,
        swapToken,
    ]);

    // TODO: may need config in query key (chain switch)
    const { data: tasks, status } = useQuery({
        queryKey: ["ramp", { ...intent?.toJson() }],
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

    /**
     * Given the user's intended amount to deposit, and available balances of involved tokens,
     * taking into consideration constraints on remaining balance of the swap token, computes
     * the amount of the swap token that will be swapped.
     *
     * @param intendedDepositAmount - The amount of the deposit token that the user intends to deposit.
     * @param availableSwapTokenBalance - The balance of the swap token that is available to swap.
     * @param availableDepositTokenBalance - The balance of the deposit token that is available to deposit.
     * @param minRemainingSwapTokenBalance - The minimum amount of the swap token that must remain after the swap.
     * @returns The amount of the swap token that will be swapped.
     */
    function handleComputeSwapAmount(
        intendedDepositAmount: bigint,
        availableSwapTokenBalance: bigint,
        availableDepositTokenBalance: bigint,
        minRemainingSwapTokenBalance: bigint,
    ): bigint {
        // How much additional deposit-token do we need?
        const swapNeeded =
            intendedDepositAmount > availableDepositTokenBalance
                ? intendedDepositAmount - availableDepositTokenBalance
                : BigInt(0);

        // How much swap-token can we safely spend while leaving the required remainder?
        const maxSwappable =
            availableSwapTokenBalance > minRemainingSwapTokenBalance
                ? availableSwapTokenBalance - minRemainingSwapTokenBalance
                : BigInt(0);

        // We can only swap what is both needed and affordable.
        return swapNeeded < maxSwappable ? swapNeeded : maxSwappable;
    }

    /**
     * Set the amount to the sum of the input and the available balance of the deposit token,
     * taking into consideration the minimum remaining balance of the swap token.
     */
    function handleSetCombinedAmount(amount: string) {
        const amt = Number(amount);
        const availableBalance = Number(availableDepositBalance?.decimalCorrected);
        const combined = amt + availableBalance;
        setAmount(combined.toString());
    }

    // TODO: Might need dynamic message for solana address
    if (!renegadeConfig || !chainDependentAddress) {
        return (
            <main className="p-6 max-w-lg mx-auto">
                <h1 className="text-2xl font-bold">Ramp v2 Demo</h1>
                <p className="mt-4 text-muted-foreground">Connect your wallet to begin.</p>
            </main>
        );
    }

    return (
        <main className="">
            <section className="">
                <div className="flex flex-row border-b border-border">
                    <Button
                        className={cn(
                            "flex-1 border-0 font-extended text-lg font-bold",
                            isBridge ? "text-primary" : "text-muted-foreground",
                        )}
                        size="xl"
                        variant="outline"
                        onClick={() => setIsBridge(true)}
                    >
                        Bridge
                    </Button>
                    <Button
                        className={cn(
                            "flex-1 border-0 font-extended text-lg font-bold",
                            !isBridge ? "text-primary" : "text-muted-foreground",
                        )}
                        size="xl"
                        variant="outline"
                        onClick={() => setIsBridge(false)}
                    >
                        Deposit
                    </Button>
                </div>

                <div className="space-y-6 pt-6">
                    {/* Network selector */}
                    {isBridge ? (
                        <div className="flex flex-col gap-2">
                            <Label>Network</Label>
                            <NetworkSelect
                                value={bridgeNetwork}
                                onChange={setBridgeNetwork}
                                networks={availableNetworks}
                            />
                        </div>
                    ) : null}

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
                            />
                        ) : null}
                    </div>

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
                                {direction === ExternalTransferDirection.Deposit
                                    ? "Deposit"
                                    : "Withdraw"}
                            </Button>
                        </MaintenanceButtonWrapper>
                    </div>
                </div>
            </section>
        </main>
    );
}
