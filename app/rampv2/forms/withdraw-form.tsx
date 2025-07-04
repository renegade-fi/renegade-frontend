"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useAccount, useConfig as useWagmiConfig } from "wagmi";

import { canUnwrapToEth, getAllTokens } from "@/app/rampv2/token-registry";
import { ExternalTransferDirection } from "@/components/dialogs/transfer/helpers";
import { NumberInput } from "@/components/number-input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MaintenanceButtonWrapper } from "@/components/ui/maintenance-button-wrapper";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { solana } from "@/lib/viem";
import { useCurrentChain, useConfig as useRenegadeConfig } from "@/providers/state-provider/hooks";
import { BalanceRow } from "../components/balance-row";
import { MaxButton } from "../components/max-button";
import { TokenSelect } from "../components/token-select";
import { Intent } from "../core/intent";
import { TaskContext } from "../core/task-context";
import { planTasks } from "../planner/task-planner";
import { onChainBalanceQuery } from "../queries/on-chain-balance";
import { TaskQueue } from "../queue/task-queue";
import { buildBalancesCache } from "../utils/balances";

const direction = ExternalTransferDirection.Withdraw;

export default function WithdrawForm() {
    const renegadeConfig = useRenegadeConfig();
    const wagmiConfig = useWagmiConfig();
    const currentChain = useCurrentChain();
    const { address } = useAccount();

    const { connection } = useConnection();
    const { signTransaction, publicKey } = useWallet();
    const solanaAddress = publicKey ? publicKey.toBase58() : undefined;

    // ---- Local state ------------------------------------------------------
    const [mint, setMint] = useState("");
    const [amount, setAmount] = useState("");
    const [unwrapToEth, setUnwrapToEth] = useState(false);

    // -----------------------------------------------------------------------
    const network = currentChain;

    // Token list based on current chain
    const availableTokens = useMemo(() => getAllTokens(currentChain), [currentChain]);

    const chainDependentAddress = (network as number) === solana.id ? solanaAddress : address;

    // On-chain balances ------------------------------------------------------
    const { data: availableWithdrawBalance } = useQuery({
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
                depositRaw: availableWithdrawBalance?.raw,
            }),
        [network, mint, availableWithdrawBalance?.raw],
    );

    // Determine if the selected token supports unwrapping (WETH → ETH)
    const canUnwrap = useMemo(() => canUnwrapToEth(mint, network as number), [mint, network]);

    /* ---------------- Intent & Task Planning ---------------- */
    const { intent, taskCtx } = useMemo(() => {
        if (!renegadeConfig || !wagmiConfig || !chainDependentAddress)
            return { intent: undefined, taskCtx: undefined } as const;

        const ctx = TaskContext.new(
            renegadeConfig,
            wagmiConfig,
            BigInt(0), // keychainNonce not needed for withdraw
            connection,
            signTransaction ?? undefined,
            solanaAddress,
            balances,
        );

        const intent = Intent.newWithdrawIntent(ctx, {
            mint,
            chainId: network,
            amount,
            unwrapToEth: unwrapToEth && canUnwrap,
        });

        return { intent, taskCtx: ctx } as const;
    }, [
        renegadeConfig,
        wagmiConfig,
        chainDependentAddress,
        connection,
        signTransaction,
        solanaAddress,
        balances,
        mint,
        network,
        amount,
        canUnwrap,
        unwrapToEth,
    ]);

    const { data: tasks, status } = useQuery({
        queryKey: ["ramp-withdraw", { ...intent?.toJson?.() }],
        queryFn: () => {
            if (!intent || !taskCtx || !intent.amountAtomic) return undefined;
            return planTasks(intent, taskCtx);
        },
        enabled: !!intent && !!taskCtx && Object.keys(balances).length > 0,
        staleTime: 0,
    });

    function handleSubmit() {
        if (!tasks) return;
        const queue = new TaskQueue(tasks);
        queue.run();
    }

    if (!renegadeConfig || !chainDependentAddress) {
        return null; // Parent component handles connect-wallet UI.
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
                        owner={chainDependentAddress}
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
                owner={chainDependentAddress}
                wagmiConfig={wagmiConfig}
                renegadeConfig={renegadeConfig}
                connection={connection}
                onClick={setAmount}
                direction={direction}
            />

            {/* Unwrap switch (WETH → ETH) */}
            {canUnwrap ? (
                <div className={cn("items-center justify-between border p-3, flex")}>
                    <div className="space-y-0.5">
                        <Label className="" htmlFor="unwrap">
                            Withdraw ETH
                        </Label>
                        <div className="text-[0.8rem] text-muted-foreground">
                            Receive native ETH instead of wrapped ETH
                        </div>
                    </div>
                    <Switch
                        checked={unwrapToEth}
                        id="unwrap"
                        onCheckedChange={(checked) => {
                            if (typeof checked === "boolean") {
                                setUnwrapToEth(checked);
                            }
                        }}
                    />
                </div>
            ) : null}

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
                        Withdraw
                    </Button>
                </MaintenanceButtonWrapper>
            </div>
        </div>
    );
}
