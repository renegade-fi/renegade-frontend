export const TASK_TYPES = {
    APPROVE: "APPROVE",
    DEPOSIT: "DEPOSIT",
    LIFI_LEG: "LIFI_LEG",
    PERMIT2_SIG: "PERMIT2_SIG",
    WITHDRAW: "WITHDRAW",
} as const;

export type TaskType = (typeof TASK_TYPES)[keyof typeof TASK_TYPES];
