/**
 * Unified Token Registry - Single Source of Truth
 *
 * Replaces complex 5-file system with simple hardcoded rules.
 * Loads all Renegade-compatible tokens + swap/bridge inputs.
 */

import { Token as TokenClass } from "@renegade-fi/token-nextjs";

/** Token metadata with operation capabilities. */
export type Token = {
    ticker: string;
    decimals: number;
    address: `0x${string}`;
    chainId: number;
    // Operation capabilities (hardcoded per token)
    canDeposit?: boolean;
    canWithdraw?: boolean;
    canSwap?: boolean;
    canBridge?: boolean;
    // Specific tokens this can swap into
    swapInto?: string[];
};

// Convert TokenInstance from getAllTokens() to our clean Token type
function convertTokenInstance(tokenInstance: any): Token | null {
    const address = tokenInstance.address ?? tokenInstance._address;
    const chainId = tokenInstance.chain;

    if (!address || !chainId) return null;

    return {
        ticker: tokenInstance.ticker,
        decimals: tokenInstance.decimals,
        address: address as `0x${string}`,
        chainId: chainId,
        // Default: Renegade-compatible tokens can deposit/withdraw
        canDeposit: true,
        canWithdraw: true,
    };
}

// Load and transform all tokens
function loadAllTokens(): Token[] {
    const tokens: Token[] = [];

    // Load all tokens from Renegade system
    const tokenInstances = TokenClass.getAllTokens() as any[];
    for (const instance of tokenInstances) {
        const token = convertTokenInstance(instance);
        if (token !== null) {
            tokens.push(token);
        }
    }

    // Add bridged tokens (swap/bridge inputs only)
    tokens.push(
        {
            ticker: "USDC.e",
            decimals: 6,
            address: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8",
            chainId: 42161,
            canSwap: true,
            swapInto: ["USDC"], // Can swap to USDC
        },
        // {
        //     ticker: "USDT",
        //     decimals: 6,
        //     address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
        //     chainId: 42161,
        //     canSwap: true,
        //     swapInto: ["USDC"], // Can swap to USDC
        // },
        {
            ticker: "USDT",
            decimals: 6,
            address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
            chainId: 1,
            canSwap: true,
            swapInto: ["USDC"], // Can swap to USDC
        },
        {
            ticker: "USDC",
            decimals: 6,
            address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
            chainId: 1, // Ethereum mainnet
            canDeposit: true,
            canWithdraw: true,
            canBridge: true,
        },
    );

    return tokens;
}

// Apply hardcoded business rules
function applyBusinessRules(tokens: Token[]): Token[] {
    return tokens.map((token) => {
        // Special rule: USDC on Arbitrum can accept swaps
        if (token.ticker === "USDC" && token.chainId === 42161) {
            return {
                ...token,
                canSwap: true, // Can be swap target
                canDeposit: true,
                canWithdraw: true,
            };
        }

        return token;
    });
}

// Initialize token registry
const ALL_TOKENS = applyBusinessRules(loadAllTokens());

/**
 * Find token by address and chain
 * Applies: Control Flow - Push ifs up (returns null, caller handles)
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
 * Applies: Control Flow - Push ifs up (returns null, caller handles)
 */
export function getTokenByTicker(ticker: string, chainId: number): Token | null {
    return ALL_TOKENS.find((token) => token.chainId === chainId && token.ticker === ticker) ?? null;
}

/**
 * Auto-detecting lookup (ticker or address)
 * Applies: Cognitive Load Reduction - Single function for both cases
 */
export function getToken(identifier: string, chainId: number): Token | null {
    const isAddress = identifier.startsWith("0x") || identifier.startsWith("0X");
    return isAddress
        ? getTokenByAddress(identifier, chainId)
        : getTokenByTicker(identifier, chainId);
}

/**
 * Get tokens that can swap into the given token
 * Applies: Business Logic Extraction - Clear operation intent
 */
export function getSwapInputsFor(targetToken: Token): Token[] {
    return ALL_TOKENS.filter((token) => token.swapInto?.includes(targetToken.ticker) ?? false);
}
