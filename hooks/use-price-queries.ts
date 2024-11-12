import React from "react"

import { Exchange } from "@renegade-fi/react"
import { useQueries } from "@tanstack/react-query"
import { ReadyState } from "react-use-websocket"

import {
  createPriceTopic,
  createPriceQueryKey,
  getPriceFromPriceReporter,
} from "@/lib/query"
import { DISPLAY_TOKENS } from "@/lib/token"

import { usePriceWebSocket } from "./use-price-websocket"

export function usePriceQueries(
  tokens: ReturnType<typeof DISPLAY_TOKENS> = DISPLAY_TOKENS(),
  exchange: Exchange = "binance",
) {
  const subscribedTopics = React.useRef<Set<string>>(new Set())
  const { subscribeToTopic, unsubscribeFromTopic, readyState } =
    usePriceWebSocket()

  React.useEffect(() => {
    if (readyState === ReadyState.OPEN) {
      tokens.forEach((token) => {
        const topic = createPriceTopic(exchange, token.address)
        if (!subscribedTopics.current.has(topic)) {
          subscribeToTopic(topic)
          subscribedTopics.current.add(topic)
        }
      })
    }
  }, [exchange, readyState, subscribeToTopic, tokens])

  React.useEffect(() => {
    const currentTopics = subscribedTopics.current
    return () => {
      currentTopics.forEach((topic) => {
        unsubscribeFromTopic(topic)
      })
    }
  }, [unsubscribeFromTopic])

  return useQueries({
    queries: tokens.map((token) => ({
      queryKey: createPriceQueryKey(exchange, token.address),
      queryFn: () =>
        getPriceFromPriceReporter(createPriceTopic(exchange, token.address)),
      initialData: 0,
      staleTime: Infinity,
      retry: false,
    })),
  })
}
