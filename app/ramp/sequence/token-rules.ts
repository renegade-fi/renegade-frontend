/** Token rule utilities (functional version) */

import type { Token as TokenClass } from "@renegade-fi/token-nextjs";

// Instance type of the Token class exported by the package
export type TokenInstance = InstanceType<typeof TokenClass>;

export type OperationRule = Partial<{
    swap: true;
    bridge: true;
    wrap: true;
    unwrap: true;
    deposit: true;
    withdraw: true;
    permit2: true;
}>;

// ticker -> chainId -> rule
export type TokenRuleMap = Record<string, Partial<Record<number, OperationRule>>>;

export type TokenMeta = TokenInstance & {
    // operation booleans
    swap: boolean;
    bridge: boolean;
    wrap: boolean;
    unwrap: boolean;
    deposit: boolean;
    withdraw: boolean;
    permit2: boolean;
};

// Flags default – cast to any to strip token fields from type list
const DEFAULT_META_FLAGS: Pick<
    TokenMeta,
    "swap" | "bridge" | "wrap" | "unwrap" | "deposit" | "withdraw" | "permit2"
> = {
    swap: false,
    bridge: false,
    wrap: false,
    unwrap: false,
    deposit: false,
    withdraw: false,
    permit2: false,
};

export type GetTokenMeta = (ticker: string, chainId: number) => TokenMeta;

/**
 * Build a token-rule lookup function. Pure & stateless after creation.
 */
export function createTokenRules(
    rawTokenList: TokenInstance[],
    ruleOverlay: TokenRuleMap,
): GetTokenMeta {
    const map: Map<string, Map<number, TokenMeta>> = new Map();

    // Seed from raw list
    for (const token of rawTokenList) {
        const chainId = token.chain;
        if (chainId === undefined) continue; // Skip tokens without chain context

        const ticker = token.ticker;
        const chainMeta = map.get(ticker) ?? new Map<number, TokenMeta>();
        chainMeta.set(chainId, {
            // Spread retains enumerable props on the token instance
            ...(token as any),
            ...DEFAULT_META_FLAGS,
        } as TokenMeta);
        map.set(ticker, chainMeta);
    }

    // Apply overlay only to already-seeded tokens
    for (const [ticker, chainRules] of Object.entries(ruleOverlay)) {
        const chainMeta = map.get(ticker);
        if (!chainMeta) continue; // Unknown ticker in overlay; skip

        for (const [chainIdStr, ops] of Object.entries(chainRules)) {
            const chainId = Number(chainIdStr);
            const existing = chainMeta.get(chainId);
            if (!existing) continue; // Unknown chain for ticker; skip

            chainMeta.set(chainId, {
                ...existing,
                ...ops,
            } as TokenMeta);
        }
    }

    // Final lookup fn
    return (ticker: string, chainId: number): TokenMeta => {
        const chainMeta = map.get(ticker);
        if (!chainMeta) {
            throw new Error(`TokenRules: unknown ticker ${ticker}`);
        }
        const meta = chainMeta.get(chainId);
        if (!meta) {
            throw new Error(`TokenRules: ticker ${ticker} not listed on chain ${chainId}`);
        }
        return meta;
    };
}
