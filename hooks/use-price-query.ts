import React from "react"

import { PriceReporterClient } from "@renegade-fi/price-reporter"
import { Exchange } from "@renegade-fi/react"
import { useQuery } from "@tanstack/react-query"

import { createPriceQueryKey, createPriceTopic } from "@/lib/query"
import { environment } from "@/lib/viem"

import { usePriceWebSocket } from "./use-price-websocket"

const STALE_TIME_MS = 60_000

const client = PriceReporterClient.new(environment)

export function usePriceQuery(
  baseMint: `0x${string}`,
  exchange: Exchange = "binance",
) {
  const topic = createPriceTopic(exchange, baseMint)
  const queryKey = createPriceQueryKey(exchange, baseMint)
  const { subscribeToTopic, unsubscribeFromTopic } = usePriceWebSocket()

  React.useEffect(() => {
    subscribeToTopic(topic)

    // Unsubscribe when the component unmounts or when dependencies change
    return () => {
      unsubscribeFromTopic(topic)
    }
  }, [subscribeToTopic, unsubscribeFromTopic, topic])

  return useQuery<number>({
    queryKey,
    queryFn: () => client.getPrice(baseMint),
    initialData: 0,
    staleTime: STALE_TIME_MS,
    retry: false,
  })
}
