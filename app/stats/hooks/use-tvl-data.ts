import React from "react"

import { Token } from "@renegade-fi/token-nextjs"
import { formatUnits } from "viem/utils"

import { usePriceQueries } from "@/hooks/use-price-queries"
import { amountTimesPrice } from "@/hooks/use-usd-price"
import { resolveTicker } from "@/lib/token"

import { useTvl } from "./use-tvl"

export function useTvlData() {
  const { data: tvlData } = useTvl()

  const mints = React.useMemo(() => {
    if (!tvlData) return []
    return tvlData.map((tvl) => {
      const token = resolveTicker(tvl.ticker)
      return token.address
    })
  }, [tvlData])

  const priceQueries = usePriceQueries(mints)

  const { cumulativeTvlUsd, tvlUsd } = React.useMemo(() => {
    if (!tvlData || !priceQueries.every((query) => query.data !== undefined)) {
      return { cumulativeTvlUsd: 0, tvlUsd: [] }
    }

    let totalTvlUsd = 0
    const tvlUsd: { name: string; data: number; fill: string }[] = []

    tvlData.forEach((tvl, i) => {
      const token = resolveTicker(tvl.ticker)
      if (!token) return

      const price = priceQueries[i]?.data

      if (price) {
        const usd = amountTimesPrice(tvl.tvl, price)
        const formatted = Number(formatUnits(usd, token.decimals))
        totalTvlUsd += formatted
        tvlUsd.push({
          name: tvl.ticker,
          data: formatted,
          fill: `var(--color-${tvl.ticker})`,
        })
      } else {
        console.error(`Price not found for token: ${tvl.ticker}`)
      }
    })

    return { cumulativeTvlUsd: totalTvlUsd, tvlUsd }
  }, [priceQueries, tvlData])

  return { cumulativeTvlUsd, tvlUsd }
}
