import { type Task, type TaskState, TaskType, UpdateType } from "@renegade-fi/react";

import { formatNumber } from "@/lib/format";

import { resolveAddress } from "../token";

export const formatTaskState = (state: TaskState) => {
    return {
        Completed: "Completed",
        Failed: "Failed",
        "Finding Opening": "Indexing On-chain",
        Proving: "Generating ZK Proof",
        "Proving Payment": "Proving",
        Queued: "Queued",
        Running: "In Progress",
        "Submitting Payment": "Submitting Tx",
        "Submitting Tx": "Verifying On-chain",
        "Updating Validity Proofs": "Updating Validity Proofs",
    }[state];
};

export function generateCompletionToastMessage(task: Task) {
    let message = "";
    const { task_info: taskInfo } = task;

    switch (taskInfo.task_type) {
        case TaskType.NewWallet:
            message = "Created new wallet";
            break;
        case TaskType.RefreshWallet:
            message = "Refreshed wallet";
            break;
        case TaskType.PayOfflineFee:
            message = "Paid fee";
            break;
        case TaskType.UpdateWallet:
            switch (taskInfo.update_type) {
                case UpdateType.Deposit:
                case UpdateType.Withdraw: {
                    const mint = resolveAddress(taskInfo.mint);
                    message = `${
                        taskInfo.update_type === UpdateType.Deposit ? "Deposited" : "Withdrew"
                    } ${formatNumber(taskInfo.amount, mint.decimals)} ${mint.ticker}`;
                    break;
                }
                case UpdateType.PlaceOrder:
                case UpdateType.CancelOrder: {
                    const base = resolveAddress(taskInfo.base);
                    message = `${
                        taskInfo.update_type === UpdateType.PlaceOrder ? "Placed" : "Cancelled"
                    } order to ${taskInfo.side.toLowerCase()} ${formatNumber(
                        taskInfo.amount,
                        base.decimals,
                    )} ${base.ticker}`;
                    break;
                }
            }
            break;
        case TaskType.SettleMatch: {
            const token = resolveAddress(taskInfo.base);
            const actionVerb = taskInfo.is_sell ? "Sold" : "Bought";
            message = `${actionVerb} ${formatNumber(
                taskInfo.volume,
                token.decimals,
            )} ${token.ticker}`;
            break;
        }
    }

    return message;
}

export function generateStartToastMessage(task: Task) {
    let message = "";
    const taskInfo = task.task_info;

    switch (taskInfo.task_type) {
        case TaskType.NewWallet:
            message = "Creating new wallet";
            break;
        case TaskType.RefreshWallet:
            message = "Refreshing wallet to on-chain state";
            break;
        case TaskType.PayOfflineFee:
            message = "Paying fee";
            break;
        case TaskType.UpdateWallet:
            switch (taskInfo.update_type) {
                case UpdateType.Deposit:
                case UpdateType.Withdraw: {
                    const mint = resolveAddress(taskInfo.mint); // mint is available for Deposit and Withdraw
                    message = `${
                        taskInfo.update_type === UpdateType.Deposit ? "Depositing" : "Withdrawing"
                    } ${formatNumber(taskInfo.amount, mint.decimals)} ${mint.ticker}`;
                    break;
                }
                case UpdateType.PlaceOrder:
                case UpdateType.CancelOrder: {
                    const base = resolveAddress(taskInfo.base); // base is available for PlaceOrder and CancelOrder
                    message = `${
                        taskInfo.update_type === UpdateType.PlaceOrder ? "Placing" : "Cancelling"
                    } order to ${taskInfo.side.toLowerCase()} ${formatNumber(
                        taskInfo.amount,
                        base.decimals,
                    )} ${base.ticker}`;
                    break;
                }
            }
            break;
        case TaskType.SettleMatch: {
            const token = resolveAddress(taskInfo.base); // base is available for SettleMatch
            const actionVerb = taskInfo.is_sell ? "Selling" : "Buying";
            message = `${actionVerb} ${formatNumber(
                taskInfo.volume,
                token.decimals,
            )} ${token.ticker}`;
            break;
        }
    }

    return message;
}

export function generateFailedToastMessage(task: Task) {
    let message = "";
    const taskInfo = task.task_info;

    switch (taskInfo.task_type) {
        case TaskType.NewWallet:
            message = "Failed to create new wallet. Please try again.";
            break;
        case TaskType.RefreshWallet:
            message = "Failed to refresh wallet. Wallet may already be up to date.";
            break;
        case TaskType.PayOfflineFee:
            message = "Failed to pay fee. Please try again.";
            break;
        case TaskType.UpdateWallet: {
            let token;
            if (
                taskInfo.update_type === UpdateType.Deposit ||
                taskInfo.update_type === UpdateType.Withdraw
            ) {
                token = resolveAddress(taskInfo.mint); // mint is available for Deposit and Withdraw
                const action =
                    taskInfo.update_type === UpdateType.Deposit ? "deposit" : "withdrawal";
                message = `Failed to ${action} ${formatNumber(
                    taskInfo.amount,
                    token.decimals,
                )} ${token.ticker}. Please try again.`;
            } else if (
                taskInfo.update_type === UpdateType.PlaceOrder ||
                taskInfo.update_type === UpdateType.CancelOrder
            ) {
                token = resolveAddress(taskInfo.base); // base is available for PlaceOrder and CancelOrder
                const action = taskInfo.update_type === UpdateType.PlaceOrder ? "place" : "cancel";
                message = `Failed to ${action} order for ${formatNumber(
                    taskInfo.amount,
                    token.decimals,
                )} ${token.ticker}. Please try again.`;
            }
            break;
        }
        case TaskType.SettleMatch: {
            const token = resolveAddress(taskInfo.base); // base is available for SettleMatch
            const actionVerb = taskInfo.is_sell ? "sell" : "buy";
            message = `Failed to ${actionVerb} ${formatNumber(
                taskInfo.volume,
                token.decimals,
            )} ${token.ticker}. Please try again.`;
            break;
        }
    }

    return message;
}

export function constructStartToastMessage(taskType: UpdateType) {
    let message = "";

    switch (taskType) {
        case UpdateType.Deposit:
            message = "Deposit initiated...";
            break;
        case UpdateType.Withdraw:
            message = "Withdrawal initiated...";
            break;
        case UpdateType.PlaceOrder:
            message = "Placing order...";
            break;
        case UpdateType.CancelOrder:
            message = "Cancelling order...";
            break;
    }

    return message;
}
