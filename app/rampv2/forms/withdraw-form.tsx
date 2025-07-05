"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { canUnwrapToEth, getAllTokens } from "@/app/rampv2/token-registry";
import { ExternalTransferDirection } from "@/components/dialogs/transfer/helpers";
import { NumberInput } from "@/components/number-input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MaintenanceButtonWrapper } from "@/components/ui/maintenance-button-wrapper";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
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

const direction = ExternalTransferDirection.Withdraw;

interface Props {
    env: RampEnv;
    onQueueStart?: (queue: TaskQueueType) => void;
}

export default function WithdrawForm({ env, onQueueStart }: Props) {
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
    const [mint, setMint] = useState("");
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
            if (!intent || !taskCtx || !intent.amountAtomic) return undefined;
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
        <div className="space-y-6 pt-6">
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
                        {submitLabel}
                    </Button>
                </MaintenanceButtonWrapper>
            </div>
        </div>
    );
}
