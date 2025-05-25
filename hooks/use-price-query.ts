import React from "react"

import { Exchange } from "@renegade-fi/react"
import { Token } from "@renegade-fi/token-nextjs"
import { useQuery } from "@tanstack/react-query"

import {
  createPriceTopic,
  createPriceQueryKey,
  getPriceFromPriceReporter,
} from "@/lib/query"

import { usePriceWebSocket } from "./use-price-websocket"

const STALE_TIME_MS = 60_000

export function usePriceQuery(
  baseMint: `0x${string}`,
  exchange: Exchange = "binance",
) {
  const token = Token.findByAddress(baseMint)
  const tokenSupported = token.supportedExchanges.has(exchange)

  const topic = createPriceTopic(exchange, baseMint)
  const queryKey = createPriceQueryKey(exchange, baseMint)
  const { subscribeToTopic, unsubscribeFromTopic } = usePriceWebSocket()

  React.useEffect(() => {
    if (!tokenSupported) return

    subscribeToTopic(topic)

    // Unsubscribe when the component unmounts or when dependencies change
    return () => {
      unsubscribeFromTopic(topic)
    }
  }, [subscribeToTopic, unsubscribeFromTopic, topic, tokenSupported])

  return useQuery<number>({
    queryKey,
    queryFn: () => {
      if (!tokenSupported) {
        return Promise.resolve(0)
      }
      return getPriceFromPriceReporter(topic)
    },
    initialData: 0,
    staleTime: STALE_TIME_MS,
    retry: false,
  })
}
