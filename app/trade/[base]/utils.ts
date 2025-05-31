import { cookies } from "next/headers"

import type { ChainId } from "@renegade-fi/react/constants"
import { isAddress } from "viem"

import { STORAGE_SERVER_STORE } from "@/lib/constants/storage"
import {
  resolveAddress,
  resolveTicker,
  resolveTickerAndChain,
} from "@/lib/token"
import { cookieToInitialState } from "@/providers/state-provider/cookie-storage"
import type { ServerState } from "@/providers/state-provider/server-store"
import { defaultInitState } from "@/providers/state-provider/server-store"

const FALLBACK_TICKER = "WETH"

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
 * Hydrates server state from cookies
 */
export async function hydrateServerState(): Promise<ServerState> {
  const cookieStore = await cookies()
  const cookieVal = cookieStore.get(STORAGE_SERVER_STORE)?.value
  const initialState =
    cookieToInitialState(STORAGE_SERVER_STORE, cookieVal) ?? defaultInitState
  return initialState
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
  if (isValidTokenAddress(candidate)) {
    // Redirect to canonical casing if needed
    if (candidate !== baseParam) {
      return { redirect: `/trade/${candidate}` }
    }
    return { resolved: candidate }
  }

  return null
}

/**
 * Resolves a ticker parameter to a valid token address
 * Returns null if ticker resolution fails
 */
function resolveTickerParam(
  baseParam: string,
  chainId?: ChainId,
): { resolved: `0x${string}` } | { redirect: string } | null {
  try {
    let token: any
    let resolvedAddress: `0x${string}`

    // First, try to resolve the ticker to get the canonical casing
    if (chainId) {
      token = resolveTickerAndChain(baseParam, chainId)
      if (!token) throw new Error("Token not found")
      resolvedAddress = token.address.toLowerCase() as `0x${string}`
    } else {
      token = resolveTicker(baseParam)
      resolvedAddress = token.address.toLowerCase() as `0x${string}`
    }

    // Get the canonical ticker from the resolved token
    const canonicalTicker = token.ticker

    // Redirect if the input doesn't match the canonical casing
    if (baseParam !== canonicalTicker) {
      return { redirect: `/trade/${canonicalTicker}` }
    }

    if (isValidTokenAddress(resolvedAddress)) {
      return { resolved: resolvedAddress }
    }
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
  if (addressResult) {
    return addressResult
  }

  // Try resolving as ticker
  const tickerResult = resolveTickerParam(baseParam, chainId)
  console.log("🚀 ~ tickerResult:", tickerResult)
  if (tickerResult) {
    return tickerResult
  }

  // Fallback to base mint ticker
  const fallbackMint = getBaseMint(serverState)
  const fallbackTicker = getTickerForAddress(fallbackMint).toUpperCase()
  return { redirect: `/trade/${fallbackTicker}` }
}
