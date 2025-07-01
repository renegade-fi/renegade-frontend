/** Token rule utilities (functional version) */

import type { Token as TokenClass } from "@renegade-fi/token-nextjs";

// Instance type of the Token class exported by the package
export type TokenInstance = InstanceType<typeof TokenClass>;

export type OperationRule = Partial<{
    /** Whether this token can be the TARGET of a swap */
    swap: boolean;
    /** Tickers that can be swapped *into* this token (whitelist). */
    swapFrom: string[];
    bridge: boolean;
    wrap: boolean;
    unwrap: boolean;
    deposit: boolean;
    withdraw: boolean;
}>;

// ticker -> chainId -> rule
export type TokenRuleMap = Record<string, Partial<Record<number, OperationRule>>>;

export type TokenMeta = {
    /** Token ticker (e.g., "USDC") */
    ticker: string;
    /** ERC-20 decimals */
    decimals: number;
    address: `0x${string}`;
    chain: number;
    swap: boolean;
    /** Whitelisted input tickers allowed to swap into this token */
    swapFrom: string[];
    bridge: boolean;
    wrap: boolean;
    unwrap: boolean;
    deposit: boolean;
    withdraw: boolean;
};

// Flags default – keeps the full list explicit for readability
const DEFAULT_META_FLAGS: Pick<
    TokenMeta,
    "swap" | "bridge" | "wrap" | "unwrap" | "deposit" | "withdraw"
> = {
    swap: false,
    bridge: false,
    wrap: false,
    unwrap: false,
    deposit: false,
    withdraw: false,
};

// Default values for non-boolean properties
const DEFAULT_META_ARRAYS: Pick<TokenMeta, "swapFrom"> = {
    swapFrom: [],
};

export type GetTokenMeta = (identifier: string, chainId: number) => TokenMeta;

/**
 * Build a token-rule lookup function. Pure & stateless after creation.
 */
export function createTokenRules(
    rawTokenList: TokenInstance[],
    ruleOverlay: TokenRuleMap,
): GetTokenMeta {
    // Two-level maps keyed by ticker and by lowercase address for fast lookup either way.
    const tickerMap: Map<string, Map<number, TokenMeta>> = new Map();
    const addressMap: Map<string, Map<number, TokenMeta>> = new Map();

    for (const token of rawTokenList) {
        const chainId = token.chain;
        if (chainId === undefined) continue; // Skip tokens without chain context

        const ticker = token.ticker;
        const decimals = token.decimals;
        const addr = (token as any).address ?? (token as any)._address;

        const baseMeta: TokenMeta = {
            ticker,
            decimals,
            address: addr as `0x${string}`,
            chain: chainId,
            ...DEFAULT_META_FLAGS,
            ...DEFAULT_META_ARRAYS,
        } as TokenMeta;

        // Insert into ticker map
        const chainMetaByTicker = tickerMap.get(ticker) ?? new Map<number, TokenMeta>();
        chainMetaByTicker.set(chainId, baseMeta);
        tickerMap.set(ticker, chainMetaByTicker);

        // Insert into address map (stored lowercase for case-insensitive lookup)
        const addrLc = addr.toLowerCase();
        const chainMetaByAddr = addressMap.get(addrLc) ?? new Map<number, TokenMeta>();
        chainMetaByAddr.set(chainId, baseMeta);
        addressMap.set(addrLc, chainMetaByAddr);
    }

    // Apply overlay only to already-seeded tokens
    for (const [ticker, chainRules] of Object.entries(ruleOverlay)) {
        const chainMeta = tickerMap.get(ticker);
        if (!chainMeta) continue; // Unknown ticker in overlay; skip

        for (const [chainIdStr, ops] of Object.entries(chainRules)) {
            const chainId = Number(chainIdStr);
            const existing = chainMeta.get(chainId);
            if (!existing) continue; // Unknown chain for ticker; skip

            const updated = { ...existing, ...ops } as TokenMeta;
            chainMeta.set(chainId, updated);

            // Also update address map entry to keep both maps in sync
            const addrLc = updated.address.toLowerCase();
            const addrChainMeta = addressMap.get(addrLc);
            if (addrChainMeta) {
                addrChainMeta.set(chainId, updated);
            }
        }
    }

    // Final lookup fn
    return (identifier: string, chainId: number): TokenMeta => {
        // Determine if identifier is address (starts with 0x) or ticker
        const isAddress = identifier.startsWith("0x") || identifier.startsWith("0X");
        const key = isAddress ? identifier.toLowerCase() : identifier;
        const mapToUse = isAddress ? addressMap : tickerMap;

        const chainMeta = mapToUse.get(key);
        if (!chainMeta) {
            throw new Error(
                `TokenRules: unknown ${isAddress ? "address" : "ticker"} ${identifier}`,
            );
        }
        const meta = chainMeta.get(chainId);
        if (!meta) {
            throw new Error(
                `TokenRules: ${isAddress ? "address" : "ticker"} ${identifier} not listed on chain ${chainId}`,
            );
        }
        return meta;
    };
}
