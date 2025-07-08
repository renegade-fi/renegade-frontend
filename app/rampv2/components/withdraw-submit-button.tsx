"use client";

import { Loader2 } from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { MaintenanceButtonWrapper } from "@/components/ui/maintenance-button-wrapper";
import type { Intent } from "../core/intent";
import type { Task } from "../core/task";
import type { TaskQueue as TaskQueueType } from "../queue/task-queue";
import { TaskQueue } from "../queue/task-queue";

interface WithdrawSubmitButtonProps {
    unwrapToEth: boolean;
    canUnwrap: boolean;
    intent?: Intent;
    tasks?: Task[];
    status?: "idle" | "pending" | "success" | "error";
    renegadeBalanceRaw?: bigint;
    onQueueStart?: (queue: TaskQueueType) => void;
}

export function WithdrawSubmitButton({
    unwrapToEth,
    canUnwrap,
    intent,
    tasks,
    status,
    renegadeBalanceRaw,
    onQueueStart,
}: WithdrawSubmitButtonProps) {
    // ---------------- Planning & Balance Checks ---------------- //
    const isPlanningLoading = status === "pending" && intent?.needsRouting();

    const submitLabel = useMemo(() => {
        return unwrapToEth && canUnwrap ? "Withdraw & Unwrap" : "Withdraw";
    }, [unwrapToEth, canUnwrap]);

    const hasEnoughBalance = useMemo(() => {
        if (!intent) return true;
        const available = renegadeBalanceRaw ?? BigInt(0);
        return intent.isBalanceSufficient(available);
    }, [intent, renegadeBalanceRaw]);

    const isDisabled =
        !intent ||
        isPlanningLoading ||
        !hasEnoughBalance ||
        (intent.needsRouting() ? status !== "success" : false);

    const displayLabel = isPlanningLoading
        ? "Retrieving unwrap info"
        : hasEnoughBalance
          ? submitLabel
          : "Insufficient Renegade balance";

    // ---------------- Submit Handler --------------------------- //
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
                    size="xl"
                    type="submit"
                    variant="outline"
                    onClick={handleSubmit}
                    disabled={isDisabled}
                >
                    {isPlanningLoading && <Loader2 className="mr-2 h-6 w-6 animate-spin" />}
                    {displayLabel}
                </Button>
            </MaintenanceButtonWrapper>
        </div>
    );
}
