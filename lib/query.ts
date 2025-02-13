import { Exchange, getDefaultQuoteToken, Token } from "@renegade-fi/react"
import { Query, QueryClient } from "@tanstack/react-query"

import { remapToken } from "@/lib/token"

// Helper function defining a global rule for invalidating queries
// We invalidate queries that are:
// - Not static (finite stale time)
// - Not a price query
//
// TODO: We should invalidate queries related to wallet / on-chain state
// We apply a general global rule for now because it doesn't hurt to have fresh data.
export function shouldInvalidate(query: Query, queryClient: QueryClient) {
  // If the query is a price query, don't invalidate
  if (query.queryKey.includes("price")) {
    return false
  }

  // Invalidate if the effective stale time is not set to infinite.
  const defaultStaleTime =
    queryClient.getQueryDefaults(query.queryKey).staleTime ?? 0

  const staleTimes = query.observers
    .map((observer) => observer.options.staleTime ?? Infinity)
    .filter((staleTime): staleTime is number => staleTime !== undefined)

  const effectiveStaleTime =
    query.getObserversCount() > 0 ? Math.min(...staleTimes) : defaultStaleTime

  return effectiveStaleTime !== Number.POSITIVE_INFINITY
}

export async function getPriceFromPriceReporter(
  topic: string,
): Promise<number> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 1000) // Abort after 1 second

  try {
    const res = await fetch(
      `https://${process.env.NEXT_PUBLIC_PRICE_REPORTER_URL}:3000/price/${topic}`,
      {
        signal: controller.signal,
      },
    )
    clearTimeout(timeoutId)

    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
    const text = await res.text()
    const price = parseFloat(text)
    if (isNaN(price)) throw new Error("Invalid price data")
    return price
  } catch (error) {
    console.warn(
      "Primary price fetch failed, falling back to secondary source:",
      error,
    )

    // Parse the topic to get exchange and token information
    const [exchange, baseMint] = topic.split("-") as [Exchange, `0x${string}`]

    // Only handle binance fallback for now
    if (exchange === "binance") {
      const ticker = remapToken(Token.findByAddress(baseMint).ticker)
      const url = `/api/proxy/amberdata?path=/market/spot/prices/pairs/${ticker}_usdt/latest&exchange=binance`

      const fallbackRes = await fetch(url)
      const data = await fallbackRes.json()
      return data.payload.price
    }

    // If we can't handle the fallback, throw the original error
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

export function createPriceTopic(
  exchange: Exchange = "binance",
  baseMint: `0x${string}`,
): string {
  return `${exchange}-${baseMint}-${getDefaultQuoteToken(exchange).address}`
}

export function createPriceQueryKey(
  exchange: Exchange = "binance",
  baseMint: `0x${string}`,
): string[] {
  return ["price", exchange, baseMint, getDefaultQuoteToken(exchange).address]
}

export function topicToQueryKey(topic: string): string[] {
  return ["price", ...topic.split("-")]
}

export function queryKeyToTopic(queryKey: string[]): string {
  const [, ...rest] = queryKey
  return rest.join("-")
}
