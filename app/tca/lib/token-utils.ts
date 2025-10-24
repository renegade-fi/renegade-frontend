import { Token } from "@renegade-fi/token-nextjs";
import { AVAILABLE_CHAINS } from "@/providers/wagmi-provider/config";

export type TokenInstance = InstanceType<typeof Token>;

export const WHITELISTED_TOKENS = ["WETH", "WBTC", "PENDLE", "VIRTUAL", "LINK", "ARB"] as const;

export function getTokens(): TokenInstance[] {
    const tokens: TokenInstance[] = [];
    for (const ticker of WHITELISTED_TOKENS) {
        for (const chain of AVAILABLE_CHAINS) {
            const token = Token.fromTickerOnChain(ticker, chain.id);
            if (token.ticker !== "UNKNOWN") {
                tokens.push(token);
                break;
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
