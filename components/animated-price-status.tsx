import * as React from "react"

import { Exchange } from "@renegade-fi/react"

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
  let content = "LIVE"
  if (!price) {
    // TODO: Read exchange support from Token
    content = "N/A"
  } else if (stale) {
    content = "STALE"
  }

  return (
    <span
      className={cn("transition-colors", className, {
        "text-green-price": price,
        "text-red-price": stale,
        "text-muted": !price,
      })}
    >
      {content}
    </span>
  )
}
