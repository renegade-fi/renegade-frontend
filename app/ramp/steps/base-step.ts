import type { getStatus } from "@lifi/sdk";
import type { getTaskStatus } from "@renegade-fi/react/actions";
import { getChainId, switchChain } from "wagmi/actions";
import { solana } from "@/lib/viem";
import type {
    Prereq,
    SequenceIntent,
    Step,
    StepDisplayInfo,
    StepExecutionContext,
    StepStatus,
    StepType,
} from "../types";
import { awaitSolanaConfirmation } from "./internal/solana";
import { formatStepTypeName, formatTokenAmount, resolveTokenInfo } from "./internal/token-utils";
import { waitForLiFiStatus, waitForRenegadeTask, waitForTxReceipt } from "./internal/waiters";

/**
 * Interface used for formatting
 */
// (TokenInfo type and related helpers relocated to ./internal/token-utils)

// Await-completion strategy for a step
export type AwaitMode = "none" | "renegade" | "chain" | "lifi";

// Helpers to extract return types for better typing
type RenegadeTask = Awaited<ReturnType<typeof getTaskStatus>>;
type LifiStatus = Awaited<ReturnType<typeof getStatus>>;

type AwaitResultMap = {
    none: undefined;
    chain: undefined;
    renegade: RenegadeTask;
    lifi: LifiStatus;
};

/**
 * Base implementation for all transaction steps.
 */
export abstract class BaseStep implements Step, StepDisplayInfo {
    /**
     * Prerequisites this step requires to be fulfilled *before* it executes.
     * The sequence builder will consult these flags and inject the matching
     * prerequisite steps automatically.
     */
    static prereqs: Prereq[] = [];

    // Runtime state—does not belong in constructor parameters
    public status: StepStatus = "PENDING";
    public txHash?: string;
    public taskId?: string;

    constructor(
        public id: string,
        public type: StepType,
        public chainId: number,
        public mint: `0x${string}`,
        public amount: bigint,
        public awaitMode: AwaitMode,
    ) {}

    /** Human-friendly display name derived from step type. */
    get name(): string {
        return formatStepTypeName(this.type);
    }

    /** Token amount and ticker for UI display. */
    get details(): string {
        const tokenInfo = resolveTokenInfo(this.mint, this.chainId);
        const formattedAmount = formatTokenAmount(this.amount, tokenInfo);
        return `${formattedAmount} ${tokenInfo.ticker}`;
    }

    /** Chain ID alias for UI convenience. */
    get chain(): number {
        return this.chainId;
    }

    // ---------- Chain Management ----------

    /**
     * Ensure wallet is connected to the correct chain before execution.
     */
    protected async ensureCorrectChain(ctx: StepExecutionContext): Promise<void> {
        const targetChainId = this.chainId;

        // Do not attempt wagmi chain switch for Solana legs – different connector.
        if (targetChainId === solana.id) {
            return;
        }

        const currentChainId = getChainId(ctx.wagmiConfig);
        if (currentChainId === targetChainId) {
            return; // already on correct EVM chain
        }

        await switchChain(ctx.wagmiConfig, { chainId: targetChainId });
    }

    // ---------- Step Interface Implementation ----------

    /** Default: no approval required. Override in subclasses as needed. */
    async approvalRequirement(_ctx: StepExecutionContext): Promise<
        | {
              spender: `0x${string}`;
              amount: bigint;
          }
        | undefined
    > {
        return undefined;
    }

    /** Execute the step's core logic. Must be implemented by subclasses. */
    abstract run(ctx: StepExecutionContext): Promise<void>;

    // ---------- Serialization Support ----------

    /** Serialize to plain JSON for persistence. */
    toJSON(): Record<string, unknown> {
        const { id, type, chainId, mint, amount, status, txHash, taskId, awaitMode } = this;
        return { id, type, chainId, mint, amount, status, txHash, taskId, awaitMode };
    }

    /**
     * Determine whether this step should be included during sequence building.
     * Default implementation always returns true; individual steps can override.
     */
    async isNeeded(_ctx: StepExecutionContext, _intent?: SequenceIntent): Promise<boolean> {
        return true;
    }

    // ---------- Await Completion Logic ----------

    /**
     * Unified completion handler covering renegade tasks, on-chain txs, or instant steps.
     * Derived classes should call this after assigning txHash/taskId.
     */
    protected async awaitCompletion<M extends AwaitMode>(
        ctx: StepExecutionContext,
    ): Promise<AwaitResultMap[M]> {
        const handlers = {
            none: async (): Promise<AwaitResultMap[M]> => {
                this.status = "CONFIRMED";
                return undefined as AwaitResultMap[M];
            },
            renegade: async (): Promise<AwaitResultMap[M]> => {
                if (!this.taskId) {
                    this.status = "CONFIRMED";
                    return undefined as AwaitResultMap[M];
                }
                this.status = "SUBMITTED";
                const task = await waitForRenegadeTask(ctx.renegadeConfig, this.taskId);
                this.status = "CONFIRMED";
                return task as AwaitResultMap[M];
            },
            chain: async (): Promise<AwaitResultMap[M]> => {
                if (!this.txHash) {
                    this.status = "CONFIRMED";
                    return undefined as AwaitResultMap[M];
                }
                this.status = "SUBMITTED";
                this.status = "CONFIRMING";
                if (this.chainId === solana.id && ctx.connection) {
                    await awaitSolanaConfirmation(this.txHash as string, ctx.connection);
                } else {
                    await waitForTxReceipt(ctx.getPublicClient(this.chainId), this.txHash);
                }
                this.status = "CONFIRMED";
                return undefined as AwaitResultMap[M];
            },
            lifi: async (): Promise<AwaitResultMap[M]> => {
                if (!this.txHash) {
                    this.status = "CONFIRMED";
                    return undefined as AwaitResultMap[M];
                }
                this.status = "SUBMITTED";
                await waitForTxReceipt(ctx.getPublicClient(this.chainId), this.txHash);
                this.status = "CONFIRMING";
                const lifiStatus = await waitForLiFiStatus(this.txHash);
                if (lifiStatus.status === "DONE") {
                    this.status = "CONFIRMED";
                } else {
                    throw new Error(`LiFi route failed with status ${lifiStatus.status}`);
                }
                return lifiStatus as AwaitResultMap[M];
            },
        } as const;

        return handlers[this.awaitMode]();
    }
}
