import React from "react"

import { formatUnits } from "viem/utils"

import { usePriceQueries } from "@/hooks/use-price-queries"
import { amountTimesPrice } from "@/hooks/use-usd-price"
import { resolveAddress } from "@/lib/token"

import { useTvl } from "./use-tvl"

export function useTvlData(chainId: number) {
  const { data: tvlData } = useTvl(chainId)
  const mints = (tvlData || []).map((tvl) => tvl.address)
  const priceQueries = usePriceQueries(mints)

  const { cumulativeTvlUsd, tvlUsd } = React.useMemo(() => {
    if (!tvlData || !priceQueries.every((query) => query.data !== undefined)) {
      return { cumulativeTvlUsd: 0, tvlUsd: [] }
    }

    let totalTvlUsd = 0
    const tvlUsd: { name: string; data: number; fill: string }[] = []

    tvlData.forEach((tvl, i) => {
      const token = resolveAddress(tvl.address)

      const price = priceQueries[i]?.data

      if (!price) return

      const usd = amountTimesPrice(tvl.tvl, price)
      const formatted = Number(formatUnits(usd, token.decimals))
      totalTvlUsd += formatted
      tvlUsd.push({
        name: token.ticker,
        data: formatted,
        fill: `var(--color-${token.ticker})`,
      })
    })

    return { cumulativeTvlUsd: totalTvlUsd, tvlUsd }
  }, [priceQueries, tvlData])

  return { cumulativeTvlUsd, tvlUsd }
}
