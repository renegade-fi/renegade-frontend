import type { Config as RenegadeConfig } from "@renegade-fi/react";
import type { PublicClient } from "viem";
import type { Config as WagmiConfig } from "wagmi";
import { zeroAddress } from "@/lib/token";
import { getTokenByTicker } from "../token-registry";

/**
 * All type definitions for the transaction sequence system.
 *
 * Consolidated from separate files to reduce cognitive load and provide
 * a single source of truth for all sequence-related types.
 */

// ---------- Core Type Definitions ----------

/** Supported transaction step types.
 *
 * Runtime values live in STEP_TYPES; StepType is derived to keep a single source of truth.
 */
export const STEP_TYPES = {
    APPROVE: "APPROVE",
    PERMIT2_SIG: "PERMIT2_SIG",
    WRAP: "WRAP",
    UNWRAP: "UNWRAP",
    LIFI_LEG: "LIFI_LEG",
    DEPOSIT: "DEPOSIT",
    WITHDRAW: "WITHDRAW",
    PAY_FEES: "PAY_FEES",
} as const;
export type StepType = (typeof STEP_TYPES)[keyof typeof STEP_TYPES];

/** Execution status of a transaction step. */
export const STEP_STATUSES = {
    PENDING: "PENDING",
    WAITING_FOR_USER: "WAITING_FOR_USER",
    SUBMITTED: "SUBMITTED",
    CONFIRMING: "CONFIRMING",
    CONFIRMED: "CONFIRMED",
    FAILED: "FAILED",
} as const;
export type StepStatus = (typeof STEP_STATUSES)[keyof typeof STEP_STATUSES];

/**
 * Canonical data + behaviour representation of a user transaction intent.
 *
 * Combines the former plain interface and helper wrapper so that callers work
 * with a single concept, reducing cognitive overhead.
 */
export class SequenceIntent {
    /** Kind of intent. */
    readonly kind: "DEPOSIT" | "WITHDRAW";
    readonly userAddress: `0x${string}`;
    readonly fromChain: number;
    readonly toChain: number;
    /** Input token ticker for swaps. */
    readonly fromTicker?: string;
    /** Target token ticker. */
    readonly toTicker: string;
    readonly amountAtomic: bigint;

    constructor(params: {
        kind: "DEPOSIT" | "WITHDRAW";
        userAddress: `0x${string}`;
        fromChain: number;
        toChain: number;
        fromTicker?: string;
        toTicker: string;
        amountAtomic: bigint;
    }) {
        this.kind = params.kind;
        this.userAddress = params.userAddress;
        this.fromChain = params.fromChain;
        this.toChain = params.toChain;
        this.fromTicker = params.fromTicker;
        this.toTicker = params.toTicker;
        this.amountAtomic = params.amountAtomic;
    }

    /** Factory accepting either an existing SequenceIntent or a plain object. */
    static from(
        raw: SequenceIntent | ConstructorParameters<typeof SequenceIntent>[0],
    ): SequenceIntent {
        return raw instanceof SequenceIntent ? raw : new SequenceIntent(raw);
    }

    // ---------- Helper / Query Methods ----------

    isDeposit(): boolean {
        return this.kind === "DEPOSIT";
    }

    isWithdraw(): boolean {
        return this.kind === "WITHDRAW";
    }

    /** Source token ticker (explicit fromTicker or fallback to toTicker). */
    sourceTicker(): string {
        return this.fromTicker ?? this.toTicker;
    }

    /** Determine if routing (bridge/swap) is required. */
    needsRouting(): boolean {
        return this.fromChain !== this.toChain || this.sourceTicker() !== this.toTicker;
    }

    /** Resolve token address on a chain (falls back to zero address). */
    tokenAddress(ticker: string, chainId: number): `0x${string}` {
        const token = getTokenByTicker(ticker, chainId);
        return token?.address ?? (zeroAddress as `0x${string}`);
    }

    fromTokenAddress(): `0x${string}` {
        return this.tokenAddress(this.sourceTicker(), this.fromChain);
    }

    toTokenAddress(): `0x${string}` {
        return this.tokenAddress(this.toTicker, this.toChain);
    }

    /** Plain-object serialisation for storage or network transport. */
    toJSON(): {
        kind: "DEPOSIT" | "WITHDRAW";
        userAddress: `0x${string}`;
        fromChain: number;
        toChain: number;
        fromTicker?: string;
        toTicker: string;
        amountAtomic: bigint;
    } {
        return {
            kind: this.kind,
            userAddress: this.userAddress,
            fromChain: this.fromChain,
            toChain: this.toChain,
            fromTicker: this.fromTicker,
            toTicker: this.toTicker,
            amountAtomic: this.amountAtomic,
        };
    }
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
    /**
     * Return the wallet address appropriate for the given chain.
     * - EVM chains → 0x-prefixed hex address
     * - Solana → base-58 address
     */
    getOnchainAddress(chainId: number): string;

    /** Explicitly return the connected EVM wallet address (0x-prefixed). */
    getEvmAddress(): `0x${string}`;

    // Transaction context
    keychainNonce: bigint;
    permit: Partial<{
        nonce: bigint;
        deadline: bigint;
        signature: `0x${string}`;
    }>;

    /**
     * Mutable bag for lightweight data hand-offs between steps.
     * Currently used to pass the final received amount from LiFi steps.
     */
    data: {
        lifiFinalAmount?: bigint;
    };

    /** Optional Solana RPC connection (present when user has connected a Solana wallet) */
    connection?: import("@solana/web3.js").Connection;

    /** Optional signer function for Solana VersionedTransactions */
    signTransaction?: (
        tx: import("@solana/web3.js").VersionedTransaction,
    ) => Promise<import("@solana/web3.js").VersionedTransaction>;
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
    /**
     * Transaction hash or signature. Hex string for EVM chains, base58 for Solana.
     */
    txHash?: string;
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

/**
 * Prerequisite flags requested by core steps.
 * The constant object enables runtime access (e.g. Prereq.APPROVAL),
 * while the `Prereq` type is derived for compile-time checks.
 */
export const Prereq = {
    APPROVAL: "APPROVAL",
    PERMIT2: "PERMIT2",
    PAY_FEES: "PAY_FEES",
} as const;
export type Prereq = (typeof Prereq)[keyof typeof Prereq];
