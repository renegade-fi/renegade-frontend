import { Token as TokenClass } from "@renegade-fi/token-nextjs";
import { RAMP_TOKENS } from "./tokens";

// Initialize token registry
const ALL_TOKENS = loadAllTokens();

/** Token metadata with operation capabilities. */
export type Token = {
    ticker: string;
    decimals: number;
    address: `0x${string}`;
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

    return {
        ticker,
        decimals,
        address,
        chainId,
        // Default: Renegade-compatible tokens can deposit/withdraw
        canDeposit: true,
        canWithdraw: true,
        canBridge: false,
        canSwap: false,
        swapInto: [],
    };
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
export function getSwapInputsFor(targetToken: Token): Token[] {
    return ALL_TOKENS.filter((token) => token.swapInto?.includes(targetToken.ticker) ?? false);
}
