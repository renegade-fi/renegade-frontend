import { Exchange } from "@renegade-fi/react"

import { usePriceQuery } from "@/hooks/use-price-query"
import { getPriceStatus } from "@/lib/price-status"
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
  const { data: price, isStale } = usePriceQuery(mint, exchange)

  // Temporary fix for Coinbase
  if (exchange === "coinbase") {
    return (
      <span className={cn("!text-muted-foreground", className)}>NO DATA</span>
    )
  }

  const { text, statusColor } = getPriceStatus({
    price,
    isStale,
    mint,
    exchange,
  })

  return (
    <span className={cn("transition-colors", className, statusColor)}>
      {text}
    </span>
  )
}
