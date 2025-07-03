import { formatUnits } from "viem";
import { getTokenByAddress } from "../../token-registry";
import type { StepType } from "../../types";

/**
 * Internal representation of token lookup result.
 */
export interface TokenInfo {
    decimals: number;
    ticker: string;
    isFound: boolean;
}

/**
 * Resolve token metadata for a given chain & mint address.
 * Returns a fallback object when the token cannot be found so that
 * callers never need to null-check.
 */
export function resolveTokenInfo(mint: `0x${string}`, chainId: number): TokenInfo {
    const token = getTokenByAddress(mint, chainId);

    if (token) {
        return {
            decimals: token.decimals,
            ticker: token.ticker,
            isFound: true,
        } satisfies TokenInfo;
    }

    // Explicit fallback values – avoids magic numbers elsewhere
    return {
        decimals: 18, // ERC-20 default
        ticker: "UNKNOWN",
        isFound: false,
    } satisfies TokenInfo;
}

/**
 * Format a human-readable amount string using token decimals.
 */
export function formatTokenAmount(amount: bigint, tokenInfo: TokenInfo): string {
    return formatUnits(amount, tokenInfo.decimals);
}

/**
 * Convert a SCREAMING_SNAKE StepType into "Title Case" for UI labels.
 */
export function formatStepTypeName(stepType: StepType): string {
    return stepType
        .split("_")
        .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
        .join(" ");
}
