import React from "react"

import { Exchange } from "@renegade-fi/react"
import {
  queryOptions,
  useQuery,
  type UseQueryOptions,
} from "@tanstack/react-query"

import { client } from "@/lib/clients/price-reporter"
import { createPriceQueryKey, createPriceTopic } from "@/lib/query"
import { isSupportedExchange } from "@/lib/token"

import { usePriceWebSocket } from "./use-price-websocket"

export const STALE_TIME_MS = 60_000

export function priceQueryOptions(
  baseMint: `0x${string}`,
  exchange: Exchange = "renegade",
): UseQueryOptions<number> {
  const topic = createPriceTopic({ exchange, base: baseMint })

  return queryOptions<number>({
    queryKey: ["dummy"], // Consumers will replace this with either "live" or "snapshot" price query key
    queryFn: () => {
      const [ex, base, quote] = topic.split("-") as [
        Exchange,
        `0x${string}`,
        `0x${string}`,
      ]
      return client.getPriceByTopic(ex, base, quote)
    },
  })
}

export function usePriceQuery(
  baseMint: `0x${string}`,
  exchange: Exchange = "renegade",
) {
  const opts = priceQueryOptions(baseMint, exchange)
  const topic = createPriceTopic({ exchange, base: baseMint })
  const { subscribeToTopic, unsubscribeFromTopic } = usePriceWebSocket()
  const isSupported = isSupportedExchange(baseMint, exchange)
  const queryKey = createPriceQueryKey({ exchange, base: baseMint })

  React.useEffect(() => {
    if (!isSupported) return
    subscribeToTopic(topic)
    return () => {
      unsubscribeFromTopic(topic)
    }
  }, [isSupported, subscribeToTopic, unsubscribeFromTopic, topic])

  return useQuery<number>({
    ...opts,
    queryKey,
    initialData: 0,
    staleTime: STALE_TIME_MS,
    enabled: isSupported,
  })
}
