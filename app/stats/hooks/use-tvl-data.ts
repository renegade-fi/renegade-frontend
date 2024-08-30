import React from "react"

import { Token } from "@renegade-fi/react"
import { formatUnits } from "viem/utils"

import { amountTimesPrice } from "@/hooks/use-usd-price"

import { useTokenPrices } from "./use-token-prices"
import { useTvl } from "./use-tvl"

export function useTvlData() {
  const { data: tvlData } = useTvl()
  const { data: tokenPrices } = useTokenPrices()

  const { cumulativeTvlUsd, tvlUsd } = React.useMemo(() => {
    if (!tvlData || !tokenPrices) return { cumulativeTvlUsd: 0, tvlUsd: [] }

    let totalTvlUsd = 0
    const tvlUsd = []
    for (const tvl of tvlData) {
      const price = tokenPrices.find((tp) => tp.ticker === tvl.ticker)?.price
      const token = Token.findByTicker(tvl.ticker)
      if (price && token) {
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
    }

    return { cumulativeTvlUsd: totalTvlUsd, tvlUsd }
  }, [tokenPrices, tvlData])
  return { cumulativeTvlUsd, tvlUsd }
}
