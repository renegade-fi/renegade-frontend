import React from "react"

import { PriceReporterClient } from "@renegade-fi/price-reporter"
import { Exchange } from "@renegade-fi/react"
import { useQueries } from "@tanstack/react-query"
import { ReadyState } from "react-use-websocket"

import { createPriceQueryKey, createPriceTopic } from "@/lib/query"
import { DISPLAY_TOKENS } from "@/lib/token"
import { environment } from "@/lib/viem"

import { usePriceWebSocket } from "./use-price-websocket"

const client = PriceReporterClient.new(environment)

export function usePriceQueries(
  tokens: ReturnType<typeof DISPLAY_TOKENS> = DISPLAY_TOKENS(),
  exchange: Exchange = "renegade",
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
      queryFn: () => client.getPrice(token.address),
      initialData: 0,
      staleTime: Infinity,
      retry: false,
    })),
  })
}
