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

export type StepType =
    | "APPROVE"
    | "PERMIT2_SIG"
    | "WRAP"
    | "UNWRAP"
    | "BRIDGE"
    | "DEPOSIT"
    | "WITHDRAW"
    | "SWAP";

export type StepStatus =
    | "PENDING" // not started
    | "WAITING_FOR_USER" // wallet opened
    | "SUBMITTED" // tx hash obtained
    | "CONFIRMING" // receipt polling
    | "CONFIRMED"
    | "FAILED";

export interface SequenceIntent {
    kind: "DEPOSIT" | "WITHDRAW" | "SWAP";
    userAddress: `0x${string}`;
    fromChain: number;
    toChain: number;
    /** Input token for swap, or deposit/withdraw token */
    fromTicker?: string;
    /** Target token for swap, or deposit/withdraw token */
    toTicker: string;
    amountAtomic: bigint;
}

// ---------- Execution Interfaces ----------

/**
 * Shared execution context passed into every Step.run().
 *
 * Provides all necessary tools for step execution while keeping
 * the interface focused and easy to understand.
 */
export interface StepExecutionContext {
    /** Get (memoized) read-only client for any chain. */
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
    /** Human-friendly display name (e.g., "Approve"). */
    readonly name: string;
    /** Additional details for UI display (token + amount). */
    readonly details: string;
    /** Convenience alias for `chainId`. */
    readonly chain: number;
}

/**
 * Step with UI display information.
 *
 * Our BaseStep implements both Step and StepDisplayInfo interfaces,
 * so this type represents the complete step with all capabilities.
 * This is the type typically used by UI components that need both
 * execution state and display formatting.
 */
export type StepWithDisplay = Step & StepDisplayInfo;
