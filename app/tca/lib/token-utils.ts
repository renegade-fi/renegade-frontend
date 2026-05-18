import { Token } from "@renegade-fi/token-nextjs";
import { base } from "viem/chains";
import type { TokenInstance } from "@/lib/token";

// TCA simulations are Base-only. Tickers must match the casing used in the
// Base mainnet token mapping (e.g. "cbBTC", not "CBBTC"); Token.fromTickerOnChain
// returns an "UNKNOWN" sentinel for ticker/chain pairs that don't resolve.
const WHITELISTED_TOKENS = ["WETH", "cbBTC", "VIRTUAL"] as const;
const TCA_CHAIN_ID = base.id;

export function getTokens(): TokenInstance[] {
    const tokens: TokenInstance[] = [];
    for (const ticker of WHITELISTED_TOKENS) {
        const token = Token.fromTickerOnChain(ticker, TCA_CHAIN_ID);
        if (token.ticker !== "UNKNOWN") {
            tokens.push(token);
        }
    }
    return tokens;
}

export function findTokenByAddress(address: string | undefined): TokenInstance | undefined {
    if (!address) return undefined;
    const target = address.toLowerCase();
    return getTokens().find((t) => t.address.toLowerCase() === target);
}

export function findTokenByTicker(ticker: string | undefined): TokenInstance | undefined {
    if (!ticker) return undefined;
    const upper = ticker.toUpperCase();
    return getTokens().find((t) => t.ticker.toUpperCase() === upper);
}
