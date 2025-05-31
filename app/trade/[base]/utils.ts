import type { ChainId } from "@renegade-fi/react/constants"
import { isAddress } from "viem"

import {
  resolveAddress,
  resolveTicker,
  resolveTickerAndChain,
} from "@/lib/token"
import type { ServerState } from "@/providers/state-provider/server-store"

export const FALLBACK_TICKER = "WETH"
const zeroAddress = "0x0000000000000000000000000000000000000000"

const zeroAddress = "0x0000000000000000000000000000000000000000"

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
 * Resolves an address parameter to a valid token address
 * Returns null if the input is not a valid address
 */
function resolveAddressParam(
  baseParam: string,
): { resolved: `0x${string}` } | { redirect: string } | null {
  if (!isAddress(baseParam)) {
    return null
  }

  const candidate = baseParam.toLowerCase()
  // Redirect to canonical casing if needed
  if (candidate !== baseParam) {
    return { redirect: `/trade/${candidate}` }
  }
  return { resolved: candidate }
}

/**
 * Resolves a ticker parameter to a valid token address
 * Returns null if ticker resolution fails
 */
export function resolveTickerParam(
  baseParam: string,
  chainId?: ChainId,
): { resolved: `0x${string}` } | { redirect: string } | null {
  try {
    let token: any
    let resolvedAddress: `0x${string}`

    // First, try to resolve the ticker to get the canonical casing
    if (chainId) {
      token = resolveTickerAndChain(baseParam, chainId)
      if (!token || token.address === zeroAddress)
        throw new Error("Token not found")
      resolvedAddress = token.address.toLowerCase() as `0x${string}`
    } else {
      token = resolveTicker(baseParam)
      if (!token || token.address === zeroAddress)
        throw new Error("Token not found")
      resolvedAddress = token.address.toLowerCase() as `0x${string}`
    }

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
 * Resolves a base parameter (ticker or address) to a valid token address
 * Returns either the resolved address or a redirect instruction
 */
export function resolveTokenParam(
  baseParam: string,
  chainId?: ChainId,
  serverState?: ServerState,
): { resolved: `0x${string}` } | { redirect: string } {
  // Try resolving as address first
  const addressResult = resolveAddressParam(baseParam)
  if (addressResult && "redirect" in addressResult) {
    return addressResult
  }
  if (
    addressResult &&
    "resolved" in addressResult &&
    isValidTokenAddress(addressResult.resolved)
  ) {
    return addressResult
  }

  // Try resolving as ticker
  const tickerResult = resolveTickerParam(baseParam, chainId)
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
