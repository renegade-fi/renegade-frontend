"use client"

import * as React from "react"

import { Exchange } from "@renegade-fi/react"

import { usePriceQuery } from "@/hooks/use-price-query"
import { formatCurrency } from "@/lib/format"
import { cn } from "@/lib/utils"

export function AnimatedPrice({
  className,
  exchange = "binance",
  mint,
}: {
  className?: string
  exchange?: Exchange
  mint: `0x${string}`
}) {
  const { data: price } = usePriceQuery(mint, exchange)
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

  return (
    <span
      key={animationKey}
      className={cn("transition-colors", className, {
        "animate-price-green": price > prev.current,
        "animate-price-red": price < prev.current,
        // TODOL Use exchange support from Token
        "text-muted": !price,
      })}
    >
      {formatCurrency(price)}
    </span>
  )
}
