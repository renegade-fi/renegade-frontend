import * as React from "react"

import { Exchange, Token } from "@renegade-fi/react"

import { usePriceQuery } from "@/hooks/use-price-query"
import { cn } from "@/lib/utils"

export function AnimatedPriceStatus({
  className,
  exchange = "binance",
  mint,
}: {
  className?: string
  exchange?: Exchange
  mint: `0x${string}`
}) {
  const { data: price, dataUpdatedAt } = usePriceQuery(mint, exchange)

  const stale = Date.now() - dataUpdatedAt > 60000

  const token = Token.findByAddress(mint)
  const tokenSupported = token.supportedExchanges.has(exchange)
  let content = "LIVE"
  // Temporary fix for Coinbase
  if (exchange === "coinbase") {
    return (
      <span className={cn("!text-muted-foreground", className)}>NO DATA</span>
    )
  }
  if (!tokenSupported) {
    content = "N/A"
  } else if (stale) {
    content = "STALE"
  }

  return (
    <span
      className={cn("transition-colors", className, {
        "text-green-price": price,
        "text-red-price": stale,
        "text-muted": !tokenSupported,
      })}
    >
      {content}
    </span>
  )
}
