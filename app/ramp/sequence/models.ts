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
    token: `0x${string}`;
    amount: bigint;
    status: StepStatus;
    txHash?: `0x${string}`;
}

export interface SequenceIntent {
    kind: "DEPOSIT" | "WITHDRAW";
    userAddress: `0x${string}`;
    fromChain: number;
    toChain: number;
    tokenSymbol: string;
    amountAtomic: bigint;
}
