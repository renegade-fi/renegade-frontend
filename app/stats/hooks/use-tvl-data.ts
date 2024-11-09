import React from "react"

import { Token } from "@renegade-fi/react"
import { formatUnits } from "viem/utils"

import { usePriceQueries } from "@/hooks/use-price-queries"
import { amountTimesPrice } from "@/hooks/use-usd-price"

import { useTvl } from "./use-tvl"

export function useTvlData() {
  const { data: tvlData } = useTvl()

  const mints = React.useMemo(() => {
    if (!tvlData) return []
    return tvlData.map((tvl) => {
      const token = Token.findByTicker(tvl.ticker)
      return token.address
    })
  }, [tvlData])

  const priceQueries = usePriceQueries(
    mints.map((mint) => {
      const token = Token.findByAddress(mint)
      return {
        address: mint,
        name: token.name,
        ticker: token.ticker,
        decimals: token.decimals,
      }
    }),
  )

  const { cumulativeTvlUsd, tvlUsd } = React.useMemo(() => {
    if (!tvlData || !priceQueries.every((query) => query.data !== undefined)) {
      return { cumulativeTvlUsd: 0, tvlUsd: [] }
    }

    let totalTvlUsd = 0
    const tvlUsd: { name: string; data: number; fill: string }[] = []

    tvlData.forEach((tvl, i) => {
      const token = Token.findByTicker(tvl.ticker)
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
