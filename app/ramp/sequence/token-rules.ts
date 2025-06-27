/** Token rule utilities (functional version) */

export type RawToken = {
    symbol: string;
    chainId: number;
    address?: `0x${string}`;
    decimals?: number;
    [key: string]: unknown;
};

export type OperationRule = Partial<{
    swap: true;
    bridge: true;
    wrap: true;
    unwrap: true;
    deposit: true;
    withdraw: true;
    permit2: true;
}>;

// symbol -> chainId -> rule
export type TokenRuleMap = Record<string, Partial<Record<number, OperationRule>>>;

export interface TokenMeta extends RawToken {
    // operation booleans
    swap: boolean;
    bridge: boolean;
    wrap: boolean;
    unwrap: boolean;
    deposit: boolean;
    withdraw: boolean;
    permit2: boolean;
}

const DEFAULT_META_FLAGS: Omit<TokenMeta, keyof RawToken> = {
    swap: false,
    bridge: false,
    wrap: false,
    unwrap: false,
    deposit: false,
    withdraw: false,
    permit2: false,
};

export type GetTokenMeta = (symbol: string, chainId: number) => TokenMeta;

/**
 * Build a token-rule lookup function. Pure & stateless after creation.
 */
export function createTokenRules(
    rawTokenList: RawToken[],
    ruleOverlay: TokenRuleMap,
): GetTokenMeta {
    const map: Map<string, Map<number, TokenMeta>> = new Map();

    // Seed from raw list
    for (const token of rawTokenList) {
        const symbol = token.symbol;
        const chainMeta = map.get(symbol) ?? new Map<number, TokenMeta>();
        chainMeta.set(token.chainId, {
            ...token,
            ...DEFAULT_META_FLAGS,
        } as TokenMeta);
        map.set(symbol, chainMeta);
    }

    // Apply overlay
    for (const [symbol, chainRules] of Object.entries(ruleOverlay)) {
        const chainMeta = map.get(symbol) ?? new Map<number, TokenMeta>();
        for (const [chainIdStr, ops] of Object.entries(chainRules)) {
            const chainId = Number(chainIdStr);
            const existing: TokenMeta =
                chainMeta.get(chainId) ??
                ({
                    symbol,
                    chainId,
                    ...DEFAULT_META_FLAGS,
                } as TokenMeta);
            chainMeta.set(chainId, {
                ...existing,
                ...ops,
            });
        }
        map.set(symbol, chainMeta);
    }

    // Final lookup fn
    return (symbol: string, chainId: number): TokenMeta => {
        const chainMeta = map.get(symbol);
        if (!chainMeta) {
            throw new Error(`TokenRules: unknown symbol ${symbol}`);
        }
        const meta = chainMeta.get(chainId);
        if (!meta) {
            throw new Error(`TokenRules: symbol ${symbol} not listed on chain ${chainId}`);
        }
        return meta;
    };
}
