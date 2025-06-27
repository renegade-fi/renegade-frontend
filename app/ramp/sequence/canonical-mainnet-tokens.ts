import { Token as TokenClass } from "@renegade-fi/token-nextjs";
import type { TokenInstance } from "./token-rules";

export interface CanonicalToken {
    name: string;
    ticker: string;
    address: `0x${string}`;
    decimals: number;
}

// -----------------------------------------------------------------------------
// Add canonical Layer-1 (Ethereum mainnet, chainId = 1) tokens below. This is a
// simple, declarative list that can be extended without touching any other code.
// -----------------------------------------------------------------------------
export const CANONICAL_MAINNET_TOKENS: CanonicalToken[] = [
    {
        name: "USD Coin",
        ticker: "USDC",
        address: "0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
        decimals: 6,
    },
    // Example entry (commented):
    // {
    //   name: "Tether",
    //   ticker: "USDT",
    //   address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    //   decimals: 6,
    // },
];

/**
 * Convert the plain data objects into Token instances bound to chainId 1.
 * This is used by `token-registry.ts` when building the full token list.
 */
export function getCanonicalTokenInstances(): TokenInstance[] {
    const MAINNET_ID = 1 as any; // ChainId literal cast – keeps dependency light

    return CANONICAL_MAINNET_TOKENS.map(
        (t) =>
            TokenClass.create(
                t.name,
                t.ticker,
                t.address,
                t.decimals,
                {}, // supported_exchanges (not relevant in sandbox)
                {}, // chain_addresses overrides
                "", // logo_url placeholder
                MAINNET_ID,
            ) as TokenInstance,
    );
}
