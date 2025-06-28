export type StepType =
    | "APPROVE"
    | "PERMIT2_SIG"
    | "WRAP"
    | "UNWRAP"
    | "BRIDGE"
    | "DEPOSIT"
    | "WITHDRAW";

export type StepStatus =
    | "PENDING" // not started
    | "WAITING_FOR_USER" // wallet opened
    | "SUBMITTED" // tx hash obtained
    | "CONFIRMING" // receipt polling
    | "CONFIRMED"
    | "FAILED";

export interface TxStep {
    id: string;
    type: StepType;
    chainId: number;
    mint: `0x${string}`;
    amount: bigint;
    status: StepStatus;
    txHash?: `0x${string}`;
    /**
     * Off-chain Renegade task identifier (returned by deposit/withdraw API).
     * Present only for steps that interact via the task queue rather than an on-chain tx.
     */
    taskId?: string;
}

export interface SequenceIntent {
    kind: "DEPOSIT" | "WITHDRAW";
    userAddress: `0x${string}`;
    fromChain: number;
    toChain: number;
    tokenTicker: string;
    amountAtomic: bigint;
}
