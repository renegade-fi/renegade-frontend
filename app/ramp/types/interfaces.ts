import type { Config as RenegadeConfig } from "@renegade-fi/react";
import type { PublicClient } from "viem";
import type { Config as WagmiConfig } from "wagmi";

/**
 * All type definitions for the transaction sequence system.
 *
 * Consolidated from separate files to reduce cognitive load and provide
 * a single source of truth for all sequence-related types.
 */

// ---------- Core Type Definitions ----------

/** Supported transaction step types. */
export type StepType =
    | "APPROVE"
    | "PERMIT2_SIG"
    | "WRAP"
    | "UNWRAP"
    | "BRIDGE"
    | "DEPOSIT"
    | "WITHDRAW"
    | "SWAP";

/** Execution status of a transaction step. */
export type StepStatus =
    | "PENDING" // not started
    | "WAITING_FOR_USER" // wallet opened
    | "SUBMITTED" // tx hash obtained
    | "CONFIRMING" // receipt polling
    | "CONFIRMED"
    | "FAILED";

/** User intent for creating a transaction sequence. */
export interface SequenceIntent {
    kind: "DEPOSIT" | "WITHDRAW" | "SWAP";
    userAddress: `0x${string}`;
    fromChain: number;
    toChain: number;
    /** Input token ticker for swaps. */
    fromTicker?: string;
    /** Target token ticker. */
    toTicker: string;
    amountAtomic: bigint;
}

// ---------- Execution Interfaces ----------

/**
 * Execution context providing tools and configuration for step execution.
 */
export interface StepExecutionContext {
    /** Get memoized read-only client for any chain. */
    getPublicClient(chainId: number): PublicClient;

    // Wallet and configuration access
    renegadeConfig: RenegadeConfig;
    wagmiConfig: WagmiConfig;
    getWagmiChainId(): number;
    getWagmiAddress(): `0x${string}`;

    // Transaction context
    keychainNonce: bigint;
    permit: Partial<{
        nonce: bigint;
        deadline: bigint;
        signature: `0x${string}`;
    }>;
}

/**
 * Core execution interface for transaction steps.
 *
 * Focused purely on execution concerns - UI display logic is handled
 * separately to maintain clean separation of concerns.
 */
export interface Step {
    // Core identity and state
    id: string;
    type: StepType;
    chainId: number;
    mint: `0x${string}`;
    amount: bigint;
    status: StepStatus;
    txHash?: `0x${string}`;
    taskId?: string;

    /**
     * Execute this step with the provided context.
     * Implementations should handle chain switching and error states internally.
     */
    run(ctx: StepExecutionContext): Promise<void>;

    /**
     * Check if this step requires an ERC20 allowance before execution.
     *
     * @returns Spender and amount if approval needed, undefined otherwise
     */
    approvalRequirement(ctx: StepExecutionContext): Promise<
        | {
              spender: `0x${string}`;
              amount: bigint;
          }
        | undefined
    >;
}

// ---------- UI Display Interfaces ----------

/**
 * UI display information for transaction steps.
 *
 * Separated from execution logic to allow UI components to focus
 * on presentation without understanding execution details.
 */
export interface StepDisplayInfo {
    /** Human-friendly display name. */
    readonly name: string;
    /** Token amount and ticker for display. */
    readonly details: string;
    /** Chain ID alias. */
    readonly chain: number;
}

/**
 * Complete step with execution and display capabilities.
 */
export type StepWithDisplay = Step & StepDisplayInfo;
