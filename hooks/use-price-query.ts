import React from "react"

import { Exchange } from "@renegade-fi/react"
import { useQuery } from "@tanstack/react-query"

import {
  createPriceTopic,
  createPriceQueryKey,
  getPriceFromPriceReporter,
} from "@/lib/query"

import { usePriceWebSocket } from "./use-price-websocket"

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
    queryFn: () => getPriceFromPriceReporter(topic),
    initialData: 0,
    staleTime: Infinity,
    retry: false,
  })
}
