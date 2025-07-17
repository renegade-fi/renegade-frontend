"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { canUnwrapToEth, getAllTokens } from "@/app/rampv2/token-registry";
import { NumberInput } from "@/components/number-input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { BalanceRow } from "../components/balance-row";
import { MaxButton } from "../components/max-button";
import { TokenSelect } from "../components/token-select";
import { WithdrawSubmitButton } from "../components/withdraw-submit-button";
import { Intent } from "../core/intent";
import { TaskContext } from "../core/task-context";
import { buildBalancesCache } from "../helpers";
import { onChainBalanceQuery } from "../queries/on-chain-balance";
import { planQueryOptions } from "../queries/plan";
import { renegadeBalanceQuery } from "../queries/renegade-balance";
import type { TaskQueue as TaskQueueType } from "../queue/task-queue";
import type { RampEnv } from "../types";
import { ExternalTransferDirection } from "../types";

const direction = ExternalTransferDirection.Withdraw;

interface Props {
    env: RampEnv;
    onQueueStart?: (queue: TaskQueueType) => void;
    initialMint?: `0x${string}`;
}

export default function WithdrawForm({ env, onQueueStart, initialMint }: Props) {
    const {
        renegadeConfig,
        wagmiConfig,
        connection,
        currentChain,
        evmAddress: address,
        solanaAddress,
        solanaSignTx,
    } = env;

    // --- Local State --- //
    const [mint, setMint] = useState(initialMint ?? "");
    const [amount, setAmount] = useState("");
    const [unwrapToEth, setUnwrapToEth] = useState(false);

    // --- Token List --- //
    const availableTokens = useMemo(() => getAllTokens(currentChain), [currentChain]);

    // --- On-chain Balances --- //
    const { data: availableWithdrawBalance } = useQuery({
        ...onChainBalanceQuery({
            chainId: currentChain,
            mint,
            owner: address,
            wagmiConfig,
            connection,
        }),
        enabled: !!mint,
    });

    const balances = useMemo(
        () =>
            buildBalancesCache({
                network: currentChain,
                depositMint: mint,
                depositRaw: availableWithdrawBalance?.raw,
            }),
        [currentChain, mint, availableWithdrawBalance?.raw],
    );

    // --- Renegade Balance --- //
    const { data: renegadeBalance } = useQuery({
        ...renegadeBalanceQuery({ mint, renegadeConfig }),
        enabled: !!mint && !!renegadeConfig,
    });

    // --- Unwrap Check --- //
    const canUnwrap = useMemo(() => canUnwrapToEth(mint, currentChain), [mint, currentChain]);

    // --- Intent & Task Planning --- //
    const { intent, taskCtx } = useMemo(() => {
        if (!renegadeConfig || !wagmiConfig || !address)
            return { intent: undefined, taskCtx: undefined } as const;

        const ctx = TaskContext.new(
            renegadeConfig,
            wagmiConfig,
            BigInt(0), // keychainNonce not needed for withdraw
            connection,
            solanaSignTx ?? undefined,
            solanaAddress ?? undefined,
            balances,
        );

        const intent = Intent.newWithdrawIntent(ctx, {
            mint,
            chainId: currentChain,
            amount,
            unwrapToEth: unwrapToEth && canUnwrap,
        });

        return { intent, taskCtx: ctx } as const;
    }, [
        renegadeConfig,
        wagmiConfig,
        address,
        connection,
        solanaSignTx,
        solanaAddress,
        balances,
        mint,
        currentChain,
        amount,
        canUnwrap,
        unwrapToEth,
    ]);

    const { data: plan, status } = useQuery(planQueryOptions({ intent, taskCtx }));

    const tasks = plan?.tasks;

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

                {/* Unwrap switch (WETH → ETH) */}
                {canUnwrap ? (
                    <div className="items-center justify-between border p-3 flex">
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
            </div>

            {/* Submit */}
            <WithdrawSubmitButton
                canUnwrap={canUnwrap}
                intent={intent}
                onQueueStart={onQueueStart}
                renegadeBalanceRaw={renegadeBalance?.raw}
                status={status}
                tasks={tasks}
                unwrapToEth={unwrapToEth}
            />
        </>
    );
}
