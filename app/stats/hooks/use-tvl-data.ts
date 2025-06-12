import { useMemo } from "react"

import { arbitrum, base } from "viem/chains"
import { formatUnits } from "viem/utils"

import { usePriceQueries } from "@/hooks/use-price-queries"
import { usePricesSnapshot } from "@/hooks/use-prices-snapshot"
import { amountTimesPrice } from "@/hooks/use-usd-price"
import { resolveAddress, resolveTicker } from "@/lib/token"

import { RawTvlData, useTvl } from "./use-tvl"

/** The TVL data for each token, keyed by the ticker */
type TvlData = Map<string, number>

export function useTvlData(chainId: number | undefined) {
  const { data: arbTvlData } = useTvl(arbitrum.id)
  const { data: baseTvlData } = useTvl(base.id)

  const combined: RawTvlData[] = useMemo(() => {
    const map = new Map<string, bigint>()
    arbTvlData?.forEach((tvl) => {
      const ticker = resolveAddress(tvl.address).ticker
      map.set(ticker, tvl.tvl)
    })
    baseTvlData?.forEach((tvl) => {
      const ticker = resolveAddress(tvl.address).ticker
      const existing = map.get(ticker)
      if (existing) {
        map.set(ticker, existing + tvl.tvl)
      } else {
        map.set(ticker, tvl.tvl)
      }
    })
    return Array.from(map.entries()).map(([ticker, tvl]) => ({
      address: resolveTicker(ticker).address,
      tvl,
    }))
  }, [arbTvlData, baseTvlData])
  const mints = useMemo(() => combined.map((tvl) => tvl.address), [combined])
  const pricesMap = usePricesSnapshot(mints)

  if (chainId === arbitrum.id) {
    const { totalTvlUsd, tvlUsd } = computeTvl(arbTvlData || [], pricesMap)
    return { totalTvlUsd, tvlUsd }
  } else if (chainId === base.id) {
    const { totalTvlUsd, tvlUsd } = computeTvl(baseTvlData || [], pricesMap)
    return { totalTvlUsd, tvlUsd }
  }

  // Merge the TVL data for each chain
  const { totalTvlUsd, tvlUsd } = computeTvl(combined, pricesMap)
  return { totalTvlUsd, tvlUsd }
}

/**
 * Compute the total TVL in USD and the TVL data for each token
 * @param tvlData - The TVL data for each token
 * @param prices - The prices for each token
 * @returns The total TVL in USD and the TVL data for each token
 */
function computeTvl(
  tvlData: RawTvlData[],
  prices: Map<`0x${string}`, number>,
): {
  totalTvlUsd: number
  tvlUsd: TvlData
} {
  let totalTvlUsd = 0
  const tvlUsd: TvlData = new Map()
  tvlData.forEach((tvl) => {
    const price = prices.get(tvl.address)
    if (!price) return

    const token = resolveAddress(tvl.address)
    const usd = amountTimesPrice(tvl.tvl, price)
    const formatted = Number(formatUnits(usd, token.decimals))

    totalTvlUsd += formatted
    tvlUsd.set(token.ticker, formatted)
  })
  return { totalTvlUsd, tvlUsd }
}
