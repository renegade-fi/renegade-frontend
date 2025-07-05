import { Token as TokenClass } from "@renegade-fi/token-nextjs";
import { solana } from "@/lib/viem";
import { RAMP_TOKENS, RENEGADE_OVERRIDES } from "./tokens";

// Initialize token registry
const ALL_TOKENS = loadAllTokens();

/** Token metadata with operation capabilities. */
export type Token = {
    ticker: string;
    decimals: number;
    address: `0x${string}`;
    name: string;
    chainId: number;
    // Operation capabilities
    canDeposit: boolean;
    canWithdraw: boolean;
    canBridge: boolean;
    canSwap: boolean;
    // Specific tokens this can swap into
    swapInto: string[];
};

// Load and transform all tokens
function loadAllTokens(): Token[] {
    const allTokens: Token[] = [];

    // Load all tokens from Renegade map
    const tokenInstances = TokenClass.getAllTokens();
    for (const instance of tokenInstances) {
        const token = convertTokenInstance(instance);
        if (token) allTokens.push(token);
    }

    // Flatten extra tokens defined in RAMP_TOKENS
    for (const [chainIdStr, tokenMap] of Object.entries(RAMP_TOKENS)) {
        const chainId = Number(chainIdStr);
        for (const token of Object.values(tokenMap)) {
            allTokens.push({
                ...token,
                chainId,
            });
        }
    }

    return allTokens;
}

// Convert TokenInstance from getAllTokens() to our clean Token type
function convertTokenInstance(tokenInstance: InstanceType<typeof TokenClass>): Token | null {
    const address = tokenInstance.address;
    const chainId = tokenInstance.chain;
    const ticker = tokenInstance.ticker;
    const decimals = tokenInstance.decimals;

    if (!address || !chainId || !ticker || !decimals) return null;

    // Base token with default capabilities
    let token: Token = {
        ticker,
        decimals,
        address,
        chainId,
        name: tokenInstance.name,
        // Default: Renegade-compatible tokens can deposit/withdraw
        canDeposit: true,
        canWithdraw: true,
        canBridge: false,
        canSwap: false,
        swapInto: [],
    };

    // Apply any override capabilities
    const override = RENEGADE_OVERRIDES[chainId]?.[ticker];
    if (override) {
        token = { ...token, ...override };
    }

    return token;
}

/**
 * Find token by address and chain
 */
export function getTokenByAddress(address: string, chainId: number): Token | null {
    return (
        ALL_TOKENS.find(
            (token) =>
                token.chainId === chainId && token.address.toLowerCase() === address.toLowerCase(),
        ) ?? null
    );
}

/**
 * Find token by ticker and chain
 */
export function getTokenByTicker(ticker: string, chainId: number): Token | null {
    return ALL_TOKENS.find((token) => token.chainId === chainId && token.ticker === ticker) ?? null;
}

/**
 * Get tokens that can swap into the given token
 */
export function getSwapInputsFor(mint: string, chainId: number): Token[] {
    const targetToken = getTokenByAddress(mint, chainId);
    if (!targetToken) return [];
    return ALL_TOKENS.filter((token) => {
        const includes = token.swapInto?.includes(targetToken.ticker);
        const sameChain = token.chainId === chainId;
        return includes && sameChain;
    });
}

/** Returns all tokens */
export function getAllTokens(chainId: number): Token[] {
    return ALL_TOKENS.filter((token) => token.chainId === chainId);
}

/** Returns tokens that can be bridged from the given chain */
export function getAllBridgeableTokens(chainId: number): Token[] {
    return getAllTokens(chainId).filter((token) => token.canBridge);
}

/** Returns tokens that can be deposited into the given chain */
export function getDepositTokens(chainId: number): Token[] {
    return getAllTokens(chainId).filter((token) => token.canDeposit);
}

/** Returns pairs of tokens (A, B) that can be swapped A -> B */
export function getSwapPairs(chainId: number): Array<[Token, Token]> {
    const pairs: Array<[Token, Token]> = [];
    for (const token of getAllTokens(chainId)) {
        if (token.canSwap) {
            for (const swapTo of token.swapInto) {
                const swapToToken = getTokenByTicker(swapTo, chainId);
                if (swapToToken) {
                    pairs.push([token, swapToToken]);
                }
            }
        }
    }
    return pairs;
}

/**
 * Determine if a given mint on a chain represents WETH that can be unwrapped
 * into native ETH.  Currently only applies to EVM chains (non-Solana) where
 * the token ticker equals "WETH".
 */
export function canUnwrapToEth(mint: string, chainId: number): boolean {
    const token = getTokenByAddress(mint, chainId);
    return token?.ticker === "WETH" && chainId !== solana.id;
}
