"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { MaintenanceButtonWrapper } from "@/components/ui/maintenance-button-wrapper";
import { getFormattedChainName } from "@/lib/viem";
import type { Intent } from "../core/intent";
import type { Task } from "../core/task";
import { balanceKey } from "../helpers";
import { maxBalancesQuery } from "../queries/renegade-balance";
import type { TaskQueue as TaskQueueType } from "../queue/task-queue";
import { TaskQueue } from "../queue/task-queue";

interface BridgeSubmitButtonProps {
    targetMint?: string;
    renegadeConfig: any;
    intent?: Intent;
    balances: Record<string, bigint>;
    tasks?: Task[];
    status: string;
    onQueueStart?: (queue: TaskQueueType) => void;
}

export function BridgeSubmitButton({
    targetMint,
    renegadeConfig,
    intent,
    balances,
    tasks,
    status,
    onQueueStart,
}: BridgeSubmitButtonProps) {
    // Check if max balances are reached for the target token
    const { data: maxBalancesReached } = useQuery({
        ...maxBalancesQuery({ mint: targetMint ?? "", renegadeConfig }),
        enabled: !!targetMint,
    });

    // Balance sufficiency check
    const hasEnoughBalance = useMemo(() => {
        if (!intent) return true;
        const key = balanceKey(intent.fromChain, intent.fromTokenAddress);
        const available = balances[key] ?? BigInt(0);
        return intent.isBalanceSufficient(available);
    }, [intent, balances]);

    const getDisplayLabel = () => {
        if (maxBalancesReached) {
            return "Max balances reached";
        }

        if (hasEnoughBalance) {
            return "Bridge & Deposit";
        }

        const chainName = intent ? getFormattedChainName(intent.fromChain) : "";
        return `Insufficient ${chainName} balance`;
    };

    const isDisabled = maxBalancesReached || !hasEnoughBalance || status !== "success";

    function handleSubmit() {
        if (!tasks || tasks.length === 0) return;

        const queue = new TaskQueue(tasks);
        if (onQueueStart) {
            onQueueStart(queue);
            return;
        }

        queue.run().catch(console.error);
    }

    return (
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
                    {getDisplayLabel()}
                </Button>
            </MaintenanceButtonWrapper>
        </div>
    );
}
