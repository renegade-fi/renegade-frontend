import { Token } from "@renegade-fi/token-nextjs";
import { arbitrum, arbitrumSepolia, base, baseSepolia } from "viem/chains";
import { env } from "@/env/client";
import type { TokenInstance } from "@/lib/token";

const IS_MAINNET = env.NEXT_PUBLIC_CHAIN_ENVIRONMENT === "mainnet";

const ARBITRUM_CHAIN_ID = IS_MAINNET ? arbitrum.id : arbitrumSepolia.id;
const BASE_CHAIN_ID = IS_MAINNET ? base.id : baseSepolia.id;

// V2 per-chain dropdown coverage — top 3 tokens per chain, ranked by min-side
// (i.e. min(buy_usd, sell_usd)) tradeable depth from `probe_v2_depth.py`.
// Min-side is what actually fills in a TCA simulation; one-sided pairs would
// give misleading results, so they're held back from the dropdown even when
// their total depth is large.
//
// The twap-server still records depth for the broader matrix (WBTC, LINK on
// Arbitrum); they can be re-added here when quoter rebalancing closes the
// buy-vs-sell gap.
//
// Order in this list controls dropdown order.
type ChainTokenSpec = { chainId: number; tickers: readonly string[] };

const CHAIN_TOKEN_MATRIX: readonly ChainTokenSpec[] = [
    { chainId: ARBITRUM_CHAIN_ID, tickers: ["WETH", "PENDLE", "ARB"] as const },
    { chainId: BASE_CHAIN_ID, tickers: ["VIRTUAL", "WETH", "cbBTC"] as const },
];

export function getTokens(): TokenInstance[] {
    const tokens: TokenInstance[] = [];
    for (const { chainId, tickers } of CHAIN_TOKEN_MATRIX) {
        for (const ticker of tickers) {
            const token = Token.fromTickerOnChain(ticker, chainId);
            if (token.ticker !== "UNKNOWN") {
                tokens.push(token);
            }
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
