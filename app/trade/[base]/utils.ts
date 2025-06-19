import { headers } from "next/headers";

import { STORAGE_SERVER_STORE } from "@/lib/constants/storage";
import { resolveAddress, resolveTicker, zeroAddress } from "@/lib/token";
import { cookieToInitialState } from "@/providers/state-provider/cookie-storage";
import type { ServerState } from "@/providers/state-provider/schema";
import { defaultInitState } from "@/providers/state-provider/server-store";

export const FALLBACK_TICKER = "WETH";

/**
 * Resolves a ticker to the ticker to redirect to, if necessary
 * @param ticker - The ticker to resolve
 * @param serverState - The server state
 * @returns The resolved ticker or undefined if no redirect is necessary
 */
export function getTickerRedirect(ticker: string, serverState: ServerState): string | undefined {
    const fallbackTicker = getFallbackTicker(serverState);
    const token = resolveTicker(ticker);

    // Fallback if no token found
    if (token.address === zeroAddress) return fallbackTicker;
    // Check if stablecoin
    if (token.isStablecoin()) return fallbackTicker;
    // Check casing
    if (token.ticker !== ticker) return token.ticker;
    return;
}

/**
 * Gets the cached ticker from server state, with fallback to WETH
 */
export function getFallbackTicker(serverState: ServerState): string {
    if (serverState.baseMint) {
        const baseToken = resolveAddress(serverState.baseMint);
        return baseToken.ticker;
    }
    return FALLBACK_TICKER;
}

/**
 * Hydrates server state from cookies
 */
export async function hydrateServerState(): Promise<ServerState> {
    const headersList = await headers();
    const cookieString = headersList.get("cookie")
        ? decodeURIComponent(headersList.get("cookie") ?? "")
        : "";
    const initialState =
        cookieToInitialState(STORAGE_SERVER_STORE, cookieString) ?? defaultInitState;
    return initialState;
}
