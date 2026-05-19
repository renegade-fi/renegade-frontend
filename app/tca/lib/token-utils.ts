import { Token } from "@renegade-fi/token-nextjs";
import { base, baseSepolia } from "viem/chains";
import { env } from "@/env/client";
import type { TokenInstance } from "@/lib/token";

const WHITELISTED_TOKENS = [/*"WETH", "cbBTC", */"VIRTUAL"] as const;
const TCA_CHAIN_ID = env.NEXT_PUBLIC_CHAIN_ENVIRONMENT === "mainnet" ? base.id : baseSepolia.id;

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
