"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { getTokenByAddress } from "@/app/rampv2/token-registry";
import { Button } from "@/components/ui/button";
import { MaintenanceButtonWrapper } from "@/components/ui/maintenance-button-wrapper";
import { safeParseUnits } from "@/lib/format";
import { getFormattedChainName } from "@/lib/viem";
import type { Intent } from "../core/intent";
import type { Task } from "../core/task";
import { balanceKey, isWrap } from "../helpers";
import { maxBalancesQuery } from "../queries/renegade-balance";
import type { TaskQueue as TaskQueueType } from "../queue/task-queue";
import { TaskQueue } from "../queue/task-queue";

interface DepositSubmitButtonProps {
    mint: string;
    amount: string;
    chainId: number;
    renegadeConfig: any;
    intent?: Intent;
    balances: Record<string, bigint>;
    tasks?: Task[];
    route?: import("@lifi/sdk").Route;
    status?: string; // react-query status
    onQueueStart?: (queue: TaskQueueType) => void;
}

export function DepositSubmitButton({
    mint,
    amount,
    chainId,
    renegadeConfig,
    intent,
    balances,
    tasks,
    route,
    status,
    onQueueStart,
}: DepositSubmitButtonProps) {
    // ---------------- USD Minimum Check ---------------- //
    const amountBigInt = useMemo(() => {
        if (!amount || !mint) return BigInt(0);
        const token = getTokenByAddress(mint, chainId);
        if (!token) return BigInt(0);
        const parsed = safeParseUnits(amount, token.decimals);
        return parsed instanceof Error ? BigInt(0) : parsed;
    }, [amount, mint, chainId]);

    // TODO: Guard against empty mint and add back in
    // const usdPrice = useUSDPrice(mint as `0x${string}`, amountBigInt);

    const isBelowMinimum = useMemo(() => {
        if (!amount || !mint) return false;
        const token = getTokenByAddress(mint, chainId);
        if (!token) return false;
        // const usdValue = Number(formatUnits(usdPrice, token.decimals));
        return false;
    }, [amount, mint, chainId]);

    // ---------------- Max Balances Check ---------------- //
    const { data: maxBalancesReached } = useQuery({
        ...maxBalancesQuery({ mint, renegadeConfig }),
        enabled: !!mint,
    });

    // ---------------- Balance Sufficiency --------------- //
    const hasEnoughBalance = useMemo(() => {
        if (!intent) return true;
        const key = balanceKey(intent.fromChain, intent.fromTokenAddress);
        const available = balances[key] ?? BigInt(0);
        return intent.isBalanceSufficient(available);
    }, [intent, balances]);

    // ---------------- Label Helpers --------------------- //
    function getSubmitLabel(routeParam: typeof route): string {
        if (!routeParam) return "Deposit";
        return isWrap(routeParam) ? "Wrap & Deposit" : "Swap & Deposit";
    }

    const submitLabel = getSubmitLabel(route);

    const displayLabel = maxBalancesReached
        ? "Max balances reached"
        : !hasEnoughBalance
          ? `Insufficient ${intent ? getFormattedChainName(intent.fromChain) : ""} balance`
          : isBelowMinimum
            ? "Minimum deposit is $1"
            : submitLabel;

    const isDisabled =
        !intent ||
        maxBalancesReached ||
        isBelowMinimum ||
        !hasEnoughBalance ||
        (intent.needsRouting() ? status !== "success" : false);

    // ---------------- Submit Handler -------------------- //
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
        <div className="w-full flex">
            <MaintenanceButtonWrapper messageKey="transfer" triggerClassName="flex-1">
                <Button
                    className="w-full flex-1 border-0 border-t font-extended text-2xl"
                    disabled={isDisabled}
                    onClick={handleSubmit}
                    size="xl"
                    type="submit"
                    variant="outline"
                >
                    {displayLabel}
                </Button>
            </MaintenanceButtonWrapper>
        </div>
    );
}
