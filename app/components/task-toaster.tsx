"use client";

import type { Task } from "@renegade-fi/react";
import { Loader2 } from "lucide-react";
import React from "react";
import { toast } from "sonner";

import { useTaskHistoryWebSocket } from "@/hooks/query/use-task-history-websocket";
import {
    formatTaskState,
    generateCompletionToastMessage,
    generateFailedToastMessage,
    generateStartToastMessage,
} from "@/lib/constants/task";
import {
    isCancelOrderTask,
    isDepositTask,
    isPlaceOrderTask,
    isRefreshWalletTask,
    isWithdrawTask,
} from "@/lib/task";

export function TaskToaster() {
    const seenStates = React.useRef<Map<string, string>>(new Map());

    useTaskHistoryWebSocket({
        onUpdate(task) {
            const currentState = `${task.id}-${task.state}`;
            if (seenStates.current.get(task.id) === currentState) return;
            seenStates.current.set(task.id, currentState);

            if (isWithdrawTask(task)) {
                processWithdrawTask(task);
            } else if (
                isDepositTask(task) ||
                isPlaceOrderTask(task) ||
                isCancelOrderTask(task) ||
                isRefreshWalletTask(task)
            ) {
                processTask(task);
            }
        },
    });

    return null;
}

function processTask(incomingTask: Task) {
    const state = formatTaskState(incomingTask.state);
    const id = incomingTask.id;

    if (incomingTask.state === "Completed") {
        const message = generateCompletionToastMessage(incomingTask);
        toast.success(message, { description: state, icon: undefined, id });
    } else if (incomingTask.state === "Failed") {
        const message = generateFailedToastMessage(incomingTask);
        toast.error(message, { icon: undefined, id });
    } else if (incomingTask.state === "Proving") {
        const message = generateStartToastMessage(incomingTask);
        toast.success(message, {
            description: state,
            icon: <Loader2 className="h-4 w-4 animate-spin text-black" />,
            id,
        });
    } else {
        const message = generateStartToastMessage(incomingTask);
        toast.success(message, {
            description: state,
            icon: <Loader2 className="h-4 w-4 animate-spin text-black" />,
            id,
        });
    }
}

function processWithdrawTask(incomingTask: Task) {
    if (isWithdrawTask(incomingTask)) {
        const state = formatTaskState(incomingTask.state);
        const id = incomingTask.id;

        if (incomingTask.state === "Completed") {
            const message = generateCompletionToastMessage(incomingTask);
            toast.success(message, {
                description: state,
                duration: 10000,
                icon: undefined,
                id,
            });
        } else if (incomingTask.state === "Failed") {
            const message = generateFailedToastMessage(incomingTask);
            toast.error(message, { duration: 10000, icon: undefined, id });
        } else if (incomingTask.state === "Proving") {
            const message = generateStartToastMessage(incomingTask);
            toast.success(message, {
                description: state,
                duration: 10000,
                icon: <Loader2 className="h-4 w-4 animate-spin text-black" />,
                id,
            });
        } else {
            const message = generateStartToastMessage(incomingTask);
            toast.success(message, {
                description: state,
                duration: 10000,
                icon: <Loader2 className="h-4 w-4 animate-spin text-black" />,
                id,
            });
        }
    }
}
