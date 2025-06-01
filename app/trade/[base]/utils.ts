import { resolveAddress, resolveTicker, zeroAddress } from "@/lib/token"
import type { ServerState } from "@/providers/state-provider/server-store"

export const FALLBACK_TICKER = "WETH"

/**
 * Validates that an address corresponds to a valid (non-stablecoin) token
 */
export function isValidTokenAddress(address: string): boolean {
  try {
    const token = resolveAddress(address as `0x${string}`)
    return !token.isStablecoin()
  } catch {
    return false
  }
}

/**
 * Gets the ticker for a given token address
 */
export function getTickerForAddress(address: string): string {
  try {
    const token = resolveAddress(address as `0x${string}`)
    return token.ticker
  } catch {
    return ""
  }
}

/**
 * Gets the base mint address from server state, with fallback to WETH
 */
export function getBaseMint(
  serverState: ServerState | undefined,
): `0x${string}` {
  return serverState?.order.baseMint || resolveTicker(FALLBACK_TICKER).address
}

/**
 * Resolves a ticker parameter to a valid token address
 * Returns null if ticker resolution fails
 */
export function resolveTickerParam(
  baseParam: string,
): { resolved: `0x${string}` } | { redirect: string } | null {
  try {
    let token: any
    let resolvedAddress: `0x${string}`
    token = resolveTicker(baseParam)
    if (!token || token.address === zeroAddress)
      throw new Error("Token not found")
    resolvedAddress = token.address.toLowerCase() as `0x${string}`

    // Get the canonical ticker from the resolved token
    const canonicalTicker = token.ticker

    // Redirect if the input doesn't match the canonical casing
    if (baseParam !== canonicalTicker) {
      return { redirect: `/trade/${canonicalTicker}` }
    }

    return { resolved: resolvedAddress }
  } catch {
    // Token not found
  }

  return null
}

/**
 * Resolves a base parameter (ticker only) to a valid token address
 * Returns either the resolved address or a redirect instruction
 */
export function resolveTokenParam(
  baseParam: string,
  serverState: ServerState,
): { resolved: `0x${string}` } | { redirect: string } {
  const tickerResult = resolveTickerParam(baseParam)
  if (tickerResult && "redirect" in tickerResult) {
    return tickerResult
  }
  if (
    tickerResult &&
    "resolved" in tickerResult &&
    isValidTokenAddress(tickerResult.resolved)
  ) {
    return tickerResult
  }

  // Fallback to base mint ticker
  const fallbackMint = getBaseMint(serverState)
  const fallbackTicker = getTickerForAddress(fallbackMint).toUpperCase()
  return { redirect: `/trade/${fallbackTicker}` }
}
