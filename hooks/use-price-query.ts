import React from "react"

import { Exchange } from "@renegade-fi/react"
import { useQuery } from "@tanstack/react-query"

import { client } from "@/lib/clients/price-reporter"
import { createPriceQueryKey, createPriceTopic } from "@/lib/query"
import { isSupportedExchange } from "@/lib/token"

import { usePriceWebSocket } from "./use-price-websocket"

export const STALE_TIME_MS = 60_000

export function usePriceQuery(
  baseMint: `0x${string}`,
  exchange: Exchange = "renegade",
) {
  const topic = createPriceTopic({ exchange, base: baseMint })
  const queryKey = createPriceQueryKey({ exchange, base: baseMint })
  const { subscribeToTopic, unsubscribeFromTopic } = usePriceWebSocket()
  const isSupported = isSupportedExchange(baseMint, exchange)

  React.useEffect(() => {
    if (!isSupported) {
      return
    }
    subscribeToTopic(topic)

    // Unsubscribe when the component unmounts or when dependencies change
    return () => {
      unsubscribeFromTopic(topic)
    }
  }, [isSupported, subscribeToTopic, topic, unsubscribeFromTopic])

  return useQuery<number>({
    queryKey,
    queryFn: () => queryFn(topic),
    initialData: 0,
    staleTime: STALE_TIME_MS,
    enabled: isSupported,
  })
}

function queryFn(topic: string) {
  const exchange = topic.split("-")[0] as Exchange
  const base = topic.split("-")[1] as `0x${string}`
  const quote = topic.split("-")[2] as `0x${string}`
  return client.getPriceByTopic(exchange, base, quote)
}
