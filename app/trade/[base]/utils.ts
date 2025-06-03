import { resolveAddress, resolveTicker, zeroAddress } from "@/lib/token"
import type { ServerState } from "@/providers/state-provider/schema"

export const FALLBACK_TICKER = "WETH"

/**
 * Resolves a ticker to the ticker to redirect to, if necessary
 * @param ticker - The ticker to resolve
 * @param serverState - The server state
 * @returns The resolved ticker or undefined if no redirect is necessary
 */
export function getTickerRedirect(
  ticker: string,
  serverState: ServerState,
): string | undefined {
  const fallbackTicker = getFallbackTicker(serverState)
  const token = resolveTicker(ticker)

  // Fallback if no token found
  if (token.address === zeroAddress) return fallbackTicker
  // Check if stablecoin
  if (token.isStablecoin()) return fallbackTicker
  // Check casing
  if (token.ticker !== ticker) return token.ticker
  return
}

/**
 * Gets the cached ticker from server state, with fallback to WETH
 */
export function getFallbackTicker(serverState: ServerState): string {
  if (serverState.order.baseMint) {
    const baseToken = resolveAddress(serverState.order.baseMint)
    return baseToken.ticker
  }
  return FALLBACK_TICKER
}
