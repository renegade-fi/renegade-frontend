import { Exchange } from "@renegade-fi/react"

import { resolveAddress } from "./token"

/** Mapping of token price statuses with text, statusColor, and priceColor. */
export const PRICE_STATUSES = {
  live: {
    text: "LIVE",
    statusColor: "text-green-price",
    priceColor: "",
  },
  stale: {
    text: "STALE",
    statusColor: "text-red-price",
    priceColor: "",
  },
  noData: {
    text: "NO DATA",
    statusColor: "text-muted",
    priceColor: "text-muted",
  },
  unsupported: {
    text: "N/A",
    statusColor: "text-muted",
    priceColor: "text-muted",
  },
} as const

/** Returns the price status based on price, staleness, mint, and exchange. */
export function getPriceStatus({
  price,
  isStale,
  mint,
  exchange = "binance",
}: {
  price: number | undefined
  isStale: boolean
  mint: `0x${string}`
  exchange?: Exchange
}) {
  const token = resolveAddress(mint)
  const tokenSupported = token.supportedExchanges.has(exchange)

  if (!tokenSupported) {
    return PRICE_STATUSES.unsupported
  }
  if (isStale) {
    if (!price) {
      return PRICE_STATUSES.noData
    }
    return PRICE_STATUSES.stale
  }
  return PRICE_STATUSES.live
}
