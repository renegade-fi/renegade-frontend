import { type Task, TaskType, UpdateType } from "@renegade-fi/react";

export function isRefreshWalletTask(task: Task): task is Task & {
    task_info: {
        task_type: TaskType.RefreshWallet;
    };
} {
    return task.task_info.task_type === TaskType.RefreshWallet;
}

export function isPlaceOrderTask(task: Task): task is Task & {
    task_info: {
        task_type: TaskType.UpdateWallet;
        update_type: UpdateType.PlaceOrder;
    };
} {
    return (
        task.task_info.task_type === TaskType.UpdateWallet &&
        task.task_info.update_type === UpdateType.PlaceOrder
    );
}

export function isCancelOrderTask(task: Task): task is Task & {
    task_info: {
        task_type: TaskType.UpdateWallet;
        update_type: UpdateType.CancelOrder;
    };
} {
    return (
        task.task_info.task_type === TaskType.UpdateWallet &&
        task.task_info.update_type === UpdateType.CancelOrder
    );
}

export function isDepositTask(task: Task): task is Task & {
    task_info: {
        task_type: TaskType.UpdateWallet;
        update_type: UpdateType.Deposit;
    };
} {
    return (
        task.task_info.task_type === TaskType.UpdateWallet &&
        task.task_info.update_type === UpdateType.Deposit
    );
}

export function isWithdrawTask(task: Task): task is Task & {
    task_info: {
        task_type: TaskType.UpdateWallet;
        update_type: UpdateType.Withdraw;
        mint: `0x${string}`;
        amount: bigint;
    };
} {
    return (
        task.task_info.task_type === TaskType.UpdateWallet &&
        task.task_info.update_type === UpdateType.Withdraw
    );
}
