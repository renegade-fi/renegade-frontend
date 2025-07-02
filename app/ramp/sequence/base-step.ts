import { formatUnits } from "viem";
import { getChainId, switchChain } from "wagmi/actions";
import type {
    Step,
    StepDisplayInfo,
    StepExecutionContext,
    StepStatus,
    StepType,
} from "./interfaces";
import { getTokenByAddress } from "./token-registry";

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
 * Base implementation for transaction steps.
 *
 * Provides common functionality while keeping the interface simple.
 * Implements both execution and display concerns with clear separation.
 */
export abstract class BaseStep implements Step, StepDisplayInfo {
    /**
     * Flag helper for build-time Permit2 signature insertion.
     * If `needsPermit2` is true, a Permit2SigStep will be inserted immediately before
     * this step by the sequence builder.
     */
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

    // ---------- UI Display Information (StepDisplayInfo implementation) ----------

    /**
     * Human-friendly display name derived from step type.
     * Applies cognitive load reduction by providing self-descriptive names.
     */
    get name(): string {
        return this.formatStepTypeName(this.type);
    }

    /**
     * Token amount and ticker for UI display.
     * Uses explicit token resolution with meaningful error handling.
     */
    get details(): string {
        const tokenInfo = this.resolveTokenInfo();
        const formattedAmount = this.formatTokenAmount(tokenInfo);

        return `${formattedAmount} ${tokenInfo.ticker}`;
    }

    /**
     * Convenience alias for chainId to simplify UI code.
     */
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
     * Separated from token resolution for better testability and clarity.
     */
    private formatTokenAmount(tokenInfo: TokenInfo): string {
        return formatUnits(this.amount, tokenInfo.decimals);
    }

    /**
     * Convert step type to human-friendly display name.
     * Extracts formatting logic to reduce cognitive load in the getter.
     */
    private formatStepTypeName(stepType: StepType): string {
        return stepType
            .split("_")
            .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
            .join(" ");
    }

    // ---------- Chain Management (Control Flow Improvements) ----------

    /**
     * Ensure wallet is connected to the correct chain before step execution.
     *
     * Applies "push ifs up" with early return and meaningful intermediates.
     * Uses self-descriptive variable names to reduce working memory load.
     */
    protected async ensureCorrectChain(ctx: StepExecutionContext): Promise<void> {
        const currentChainId = getChainId(ctx.wagmiConfig);
        const targetChainId = this.chainId;
        const chainSwitchRequired = currentChainId !== targetChainId;

        console.log("switch chain debug", {
            needsSwitch: chainSwitchRequired,
            currentChain: currentChainId,
            targetChain: targetChainId,
        });

        // Early return if no chain switch needed (happy path)
        if (!chainSwitchRequired) {
            return;
        }

        // Perform chain switch only when necessary
        await switchChain(ctx.wagmiConfig, {
            chainId: targetChainId,
        });
    }

    // ---------- Step Interface Implementation ----------

    /**
     * Default implementation: no approval required.
     *
     * Subclasses that need token approval should override this method.
     * Clear interface contract reduces cognitive load for implementers.
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

    /**
     * Each concrete subclass must implement its execution logic.
     *
     * Abstract method ensures all steps provide their core functionality
     * while keeping the base class focused on common concerns.
     */
    abstract run(ctx: StepExecutionContext): Promise<void>;

    // ---------- Serialization Support ----------

    /**
     * Serialize to plain JSON for persistence.
     *
     * Provides simple data export without exposing internal complexity.
     * Focuses on essential state for reconstruction.
     */
    toJSON(): Record<string, unknown> {
        const { id, type, chainId, mint, amount, status, txHash, taskId } = this;
        return { id, type, chainId, mint, amount, status, txHash, taskId };
    }
}
