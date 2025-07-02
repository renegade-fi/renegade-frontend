import { formatUnits } from "viem";
import { getChainId, switchChain } from "wagmi/actions";
import { getTokenByAddress } from "../token-registry";
import type {
    SequenceIntent,
    Step,
    StepDisplayInfo,
    StepExecutionContext,
    StepStatus,
    StepType,
} from "../types";
import type { Prereq } from "./prereq-types";

/**
 * Token resolution result with explicit success/failure states.
 * Replaces silent fallbacks with self-descriptive error handling.
 */
interface TokenInfo {
    decimals: number;
    ticker: string;
    isFound: boolean;
}

/**
 * Base implementation for all transaction steps.
 */
export abstract class BaseStep implements Step, StepDisplayInfo {
    /**
     * Indicates if this step requires a Permit2 signature.
     */
    static needsPermit2?: boolean;

    /**
     * Prerequisites this step requires to be fulfilled *before* it executes.
     * The sequence builder will consult these flags and inject the matching
     * prerequisite steps automatically.
     */
    static prereqs: Prereq[] = [];

    /**
     * For prerequisite steps that decide globally (without instantiation) if
     * they should be included – e.g. PayFeesStep.
     */
    static async isNeeded(_ctx: StepExecutionContext, _intent?: SequenceIntent): Promise<boolean> {
        return true;
    }

    /**
     * For prerequisite steps that need their specific parameters – e.g.
     * ApproveStep (requires token, amount, spender).
     */
    async isNeeded(_ctx: StepExecutionContext): Promise<boolean> {
        return true;
    }

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
        const { id, type, chainId, mint, amount, status, txHash, taskId } = this;
        return { id, type, chainId, mint, amount, status, txHash, taskId };
    }
}
