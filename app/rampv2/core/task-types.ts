export const TASK_TYPES = {
    APPROVE: "APPROVE",
    PERMIT2_SIG: "PERMIT2_SIG",
    DEPOSIT: "DEPOSIT",
    LIFI_LEG: "LIFI_LEG",
    WITHDRAW: "WITHDRAW",
    PAY_FEES: "PAY_FEES",
} as const;

export type TaskType = (typeof TASK_TYPES)[keyof typeof TASK_TYPES];
