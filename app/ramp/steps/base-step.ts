import { getStatus } from "@lifi/sdk";
import { getTaskStatus } from "@renegade-fi/react/actions";
import { formatUnits } from "viem";
import { getChainId, switchChain } from "wagmi/actions";
import { getTokenByAddress } from "../token-registry";
import type {
    Prereq,
    SequenceIntent,
    Step,
    StepDisplayInfo,
    StepExecutionContext,
    StepStatus,
    StepType,
} from "../types";

/**
 * Interface used for formatting
 */
interface TokenInfo {
    decimals: number;
    ticker: string;
    isFound: boolean;
}

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

    constructor(
        public id: string,
        public type: StepType,
        public chainId: number,
        public mint: `0x${string}`,
        public amount: bigint,
        public status: StepStatus = "PENDING",
        public txHash?: `0x${string}`,
        public taskId?: string,
        public awaitMode: AwaitMode = "none",
    ) {}

    /** Human-friendly display name derived from step type. */
    get name(): string {
        return this.formatStepTypeName(this.type);
    }

    /** Token amount and ticker for UI display. */
    get details(): string {
        const tokenInfo = this.resolveTokenInfo();
        const formattedAmount = this.formatTokenAmount(tokenInfo);

        return `${formattedAmount} ${tokenInfo.ticker}`;
    }

    /** Chain ID alias for UI convenience. */
    get chain(): number {
        return this.chainId;
    }

    // ---------- Private Helper Methods (Cognitive Load Reduction) ----------

    /**
     * Resolve token information with explicit fallback handling.
     * Applies "push ifs up" by centralizing token resolution logic.
     */
    private resolveTokenInfo(): TokenInfo {
        const token = getTokenByAddress(this.mint, this.chainId);

        // Early return for successful resolution
        if (token) {
            return {
                decimals: token.decimals,
                ticker: token.ticker,
                isFound: true,
            };
        }

        // Explicit fallback with self-descriptive defaults
        return {
            decimals: 18, // Standard ERC20 default
            ticker: "UNKNOWN",
            isFound: false,
        };
    }

    /**
     * Format token amount using resolved token information.
     */
    private formatTokenAmount(tokenInfo: TokenInfo): string {
        return formatUnits(this.amount, tokenInfo.decimals);
    }

    /**
     * Convert step type to human-friendly display name.
     */
    private formatStepTypeName(stepType: StepType): string {
        return stepType
            .split("_")
            .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
            .join(" ");
    }

    // ---------- Chain Management ----------

    /**
     * Ensure wallet is connected to the correct chain before execution.
     */
    protected async ensureCorrectChain(ctx: StepExecutionContext): Promise<void> {
        const currentChainId = getChainId(ctx.wagmiConfig);
        const targetChainId = this.chainId;
        const chainSwitchRequired = currentChainId !== targetChainId;

        if (!chainSwitchRequired) {
            return;
        }

        // Perform chain switch only when necessary
        await switchChain(ctx.wagmiConfig, {
            chainId: targetChainId,
        });
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
        switch (this.awaitMode) {
            case "none":
                this.status = "CONFIRMED";
                return undefined as AwaitResultMap[M];
            case "renegade": {
                if (!this.taskId) {
                    this.status = "CONFIRMED";
                    return undefined as AwaitResultMap[M];
                }
                this.status = "SUBMITTED";
                const task = await this.waitForRenegadeTask(ctx.renegadeConfig, this.taskId);
                this.status = "CONFIRMED";
                return task as AwaitResultMap[M];
            }
            case "chain":
                if (!this.txHash) {
                    this.status = "CONFIRMED";
                    return undefined as AwaitResultMap[M];
                }
                this.status = "SUBMITTED";
                await this.waitForTxReceipt(ctx.getPublicClient(this.chainId), this.txHash);
                this.status = "CONFIRMED";
                return undefined as AwaitResultMap[M];
            case "lifi": {
                if (!this.txHash) {
                    this.status = "CONFIRMED";
                    return undefined as AwaitResultMap[M];
                }
                this.status = "SUBMITTED";
                await this.waitForTxReceipt(ctx.getPublicClient(this.chainId), this.txHash);
                // After on-chain tx confirmed, poll LiFi backend
                this.status = "CONFIRMING";
                const lifiStatus = await this.waitForLiFiStatus(this.txHash);
                if (lifiStatus.status === "DONE") {
                    this.status = "CONFIRMED";
                } else {
                    throw new Error(`LiFi route failed with status ${lifiStatus.status}`);
                }
                // Type assertion safe: lifiStatus matches map for mode 'lifi'
                return lifiStatus as AwaitResultMap[M];
            }
        }
    }

    private async waitForRenegadeTask(cfg: any, taskId: string): Promise<RenegadeTask> {
        const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
        this.status = "CONFIRMING";
        while (true) {
            const task = await getTaskStatus(cfg, { id: taskId });
            const state = (task as any).state ?? (task as any).status;
            if (state === "Completed") return task;
            if (state === "Failed") throw new Error(`Renegade task ${taskId} failed`);
            await sleep(3000);
        }
    }

    private async waitForTxReceipt(publicClient: any, hash: `0x${string}`): Promise<void> {
        this.status = "CONFIRMING";
        await publicClient.waitForTransactionReceipt({ hash });
    }

    private async waitForLiFiStatus(txHash: `0x${string}`): Promise<LifiStatus> {
        let attempts = 0;
        const maxAttempts = 300; // 5 min at 1s intervals
        let statusRes = await getStatus({ txHash: txHash as string });
        while (
            !["DONE", "FAILED", "INVALID"].includes(statusRes.status) &&
            attempts < maxAttempts
        ) {
            await new Promise((r) => setTimeout(r, 1000));
            statusRes = await getStatus({ txHash: txHash as string });
            attempts++;
        }
        return statusRes;
    }
}
