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
    /** Human-friendly display name (e.g., "Approve"). */
    readonly name: string;
    /** Additional details for UI display (token + amount). */
    readonly details: string;
    /** Convenience alias for `chainId`. */
    readonly chain: number;
    run(ctx: StepExecutionContext): Promise<void>;
    /**
     * Return spender + amount info if this step requires an ERC20 allowance beforehand.
     * If undefined is returned, no additional approval is needed.
     */
    approvalRequirement(ctx: StepExecutionContext): Promise<
        | {
              spender: `0x${string}`;
              amount: bigint;
          }
        | undefined
    >;
}

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

import type { Config } from "@renegade-fi/react";
// -------------------- New runnable step abstractions --------------------
import { formatUnits, type PublicClient, type WalletClient } from "viem";
import { getTokenMeta } from "./token-registry";

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
    // Flag helper for build-time Permit2 signature insertion.
    // If `needsPermit2` is true, a Permit2SigStep will be inserted immediately before
    // this step by the sequence builder.
    static needsPermit2?: boolean;

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

    // ---------- New UI helper getters ----------

    /** Title-case version of the step type (e.g., "Approve"). */
    get name(): string {
        // Replace underscores with spaces, lowercase, then capitalize first letter of each word
        return this.type
            .split("_")
            .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
            .join(" ");
    }

    /** Concise amount + token snippet (e.g., "1000 0x1234…"). */
    get details(): string {
        // Show bigint as decimal using token metadata (supports bridged tokens)
        const meta = getTokenMeta(this.mint, this.chainId);
        const formattedAmount = formatUnits(this.amount, meta.decimals);
        return `${formattedAmount} ${meta.ticker}`;
    }

    /** Alias for chainId to simplify UI code. */
    get chain(): number {
        return this.chainId;
    }

    /**
     * Utility invoked by concrete steps to guarantee the wallet is connected to
     * the correct chain before continuing execution. If the wallet is already
     * on the expected chain this is a cheap no-op; otherwise we request a
     * chain switch from the wallet client.
     */
    protected async ensureCorrectChain(ctx: StepExecutionContext): Promise<void> {
        if (ctx.walletClient.chain?.id !== this.chainId) {
            await ctx.walletClient.switchChain({ id: this.chainId });
        }
    }

    /**
     * Default implementation: no approval required.
     * Subclasses that need token approval should override this method.
     */
    async approvalRequirement(_ctx: StepExecutionContext): Promise<
        | {
              spender: `0x${string}`;
              amount: bigint;
          }
        | undefined
    > {
        return undefined;
    }

    /** Each concrete subclass must implement its action logic. */
    abstract run(ctx: StepExecutionContext): Promise<void>;

    /** Serialize to plain JSON for persistence. */
    toJSON(): Record<string, unknown> {
        const { id, type, chainId, mint, amount, status, txHash, taskId } = this;
        return { id, type, chainId, mint, amount, status, txHash, taskId };
    }
}
