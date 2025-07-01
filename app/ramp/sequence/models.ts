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

// ---------- Unified runnable step definitions ----------

export interface Step {
    id: string;
    type: StepType;
    chainId: number;
    mint: `0x${string}`;
    amount: bigint;
    status: StepStatus;
    txHash?: `0x${string}`;
    taskId?: string;
    run(ctx: StepExecutionContext): Promise<void>;
}

export interface SequenceIntent {
    kind: "DEPOSIT" | "WITHDRAW";
    userAddress: `0x${string}`;
    fromChain: number;
    toChain: number;
    tokenTicker: string;
    amountAtomic: bigint;
}

import type { Config } from "@renegade-fi/react";
// -------------------- New runnable step abstractions --------------------
import type { PublicClient, WalletClient } from "viem";

/**
 * Shared execution context passed into every Step.run().
 */
export interface StepExecutionContext {
    walletClient: WalletClient;
    publicClient: PublicClient;
    renegadeConfig: Config;
    keychainNonce: bigint;
    permit: Partial<{
        nonce: bigint;
        deadline: bigint;
        signature: `0x${string}`;
    }>;
}

// Base implementation providing common fields + JSON (de)serialization helpers.
export abstract class BaseStep implements Step {
    // Flag helpers for build-time precondition insertion.
    // Subclasses can override to indicate they need preparatory steps.
    // If `needsPermit2` is true, a Permit2SigStep will be inserted immediately before
    // this step by the sequence builder.
    // If `needsApproval` returns a spender address, an ApproveStep will be inserted.
    static needsPermit2?: boolean;
    static needsApproval?: (
        chainId: number,
        mint: `0x${string}`,
    ) => { spender: `0x${string}` } | undefined;

    constructor(
        public id: string,
        public type: StepType,
        public chainId: number,
        public mint: `0x${string}`,
        public amount: bigint,
        public status: StepStatus = "PENDING",
        public txHash?: `0x${string}`,
        public taskId?: string,
    ) {}

    /** Each concrete subclass must implement its action logic. */
    abstract run(ctx: StepExecutionContext): Promise<void>;

    /** Serialize to plain JSON for persistence. */
    toJSON(): Record<string, unknown> {
        const { id, type, chainId, mint, amount, status, txHash, taskId } = this;
        return { id, type, chainId, mint, amount, status, txHash, taskId };
    }
}
