"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { canUnwrapToEth, getAllTokens } from "@/app/rampv2/token-registry";
import { NumberInput } from "@/components/number-input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MaintenanceButtonWrapper } from "@/components/ui/maintenance-button-wrapper";
import { Switch } from "@/components/ui/switch";
import { BalanceRow } from "../components/balance-row";
import { MaxButton } from "../components/max-button";
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

    const { data: plan, status } = useQuery({
        queryKey: ["ramp-withdraw", { ...intent?.toJson?.() }],
        queryFn: () => {
            if (!intent || !taskCtx) return undefined;
            return planTasks(intent, taskCtx);
        },
        enabled: !!intent && !!taskCtx && Object.keys(balances).length > 0,
        staleTime: 0,
    });

    const tasks = plan?.tasks;
    const route = plan?.route;

    // --- Dynamic button label --- //
    const submitLabel = useMemo(
        () => (unwrapToEth && canUnwrap ? "Withdraw & Unwrap" : "Withdraw"),
        [unwrapToEth, canUnwrap],
    );

    let isDisabled = true;
    if (intent) {
        if (intent.needsRouting()) {
            isDisabled = status !== "success";
        } else {
            isDisabled = false;
        }
    }

    function handleSubmit() {
        if (!tasks || tasks.length === 0) return;
        const queue = new TaskQueue(tasks);
        if (onQueueStart) {
            onQueueStart(queue);
        } else {
            queue.run().catch(console.error);
        }
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
                <BalanceRow
                    chainId={currentChain}
                    mint={mint}
                    owner={address}
                    wagmiConfig={wagmiConfig}
                    renegadeConfig={renegadeConfig}
                    connection={connection}
                    onClick={setAmount}
                    direction={direction}
                    showZero
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
            <div className="w-full flex">
                <MaintenanceButtonWrapper messageKey="transfer" triggerClassName="flex-1">
                    <Button
                        className="w-full flex-1 border-0 border-t font-extended text-2xl"
                        size="xl"
                        type="submit"
                        variant="outline"
                        onClick={handleSubmit}
                        disabled={isDisabled}
                    >
                        {submitLabel}
                    </Button>
                </MaintenanceButtonWrapper>
            </div>
        </>
    );
}
