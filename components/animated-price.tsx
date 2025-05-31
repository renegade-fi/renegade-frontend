import * as React from "react"

import { Exchange } from "@renegade-fi/react"

import { usePriceQuery } from "@/hooks/use-price-query"
import { formatCurrency } from "@/lib/format"
import { getPriceStatus } from "@/lib/price-status"
import { cn } from "@/lib/utils"

export function AnimatedPrice({
  className,
  exchange,
  mint,
}: {
  className?: string
  exchange?: Exchange
  mint: `0x${string}`
}) {
  const { data: price, isStale } = usePriceQuery(mint, exchange)
  const prev = React.useRef(price)
  const [animationKey, setAnimationKey] = React.useState(0)

  React.useEffect(() => {
    if (price !== prev.current) {
      // Use requestAnimationFrame to batch DOM updates
      requestAnimationFrame(() => {
        setAnimationKey((prevKey) => prevKey + 1)
        requestAnimationFrame(() => {
          prev.current = price // Update ref after the browser has painted
        })
      })
    }
  }, [price])

  // Temporary fix for Coinbase
  if (exchange === "coinbase") {
    return <span className={cn("text-muted-foreground", className)}>--</span>
  }

  const { priceColor } = getPriceStatus({ price, isStale, mint, exchange })

  return (
    <span
      key={animationKey}
      className={cn("transition-colors", className, priceColor, {
        "animate-price-green": price > prev.current,
        "animate-price-red": price < prev.current,
      })}
    >
      {formatCurrency(price)}
    </span>
  )
}
