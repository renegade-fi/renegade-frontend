import { useCallback } from "react"

import type { Exchange } from "@renegade-fi/react"
import { useQueries, UseQueryResult } from "@tanstack/react-query"

import { priceQueryOptions } from "@/hooks/use-price-query"

/** Similar to usePriceQueries, but does not subscribe to the websocket */
export function usePricesSnapshot(
  mints: `0x${string}`[],
  exchange: Exchange = "renegade",
): Map<`0x${string}`, number> {
  const combine = useCallback(
    (results: UseQueryResult<number>[]) => {
      const map = new Map<`0x${string}`, number>()
      results.forEach((result, i) => {
        map.set(mints[i], result.data ?? 0)
      })
      return map
    },
    [mints],
  )
  const queries = mints.map((mint) => ({
    ...priceQueryOptions(mint, exchange),
  }))

  return useQueries({
    queries,
    combine,
  })
}
