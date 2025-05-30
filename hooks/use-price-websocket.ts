import React from "react"

import { useQueryClient } from "@tanstack/react-query"
import useWebSocket, { ReadyState } from "react-use-websocket"

import { client } from "@/lib/clients/price-reporter"
import { formatCurrency } from "@/lib/format"
import { topicToQueryKey } from "@/lib/query"

export function usePriceWebSocket() {
  const queryClient = useQueryClient()

  const { sendMessage, readyState } = useWebSocket(client.getWebSocketUrl(), {
    share: true,
    filter: () => false,
    onMessage: (event) => {
      const { topic, price } = JSON.parse(event.data)
      if (!topic || !price) return

      const queryKey = topicToQueryKey(topic)
      const dataUpdatedAt = queryClient.getQueryState(queryKey)?.dataUpdatedAt
      const data = queryClient.getQueryData<number>(queryKey)

      if (!dataUpdatedAt || !data) {
        queryClient.setQueryData(queryKey, price)
        return
      }

      const currentTime = Date.now()
      const randomDelay = Math.floor(Math.random() * 2000 + 500)

      const priceNeedsUpdate = formatCurrency(data) !== formatCurrency(price)
      if (currentTime - dataUpdatedAt > randomDelay && priceNeedsUpdate) {
        queryClient.setQueryData(queryKey, price)
      }
    },
    shouldReconnect: () => true,
  })

  const subscribeToTopic = React.useCallback(
    (topic: string) => {
      if (readyState === ReadyState.OPEN) {
        sendMessage(
          JSON.stringify({
            method: "subscribe",
            topic,
          }),
        )
      }
    },
    [readyState, sendMessage],
  )

  const unsubscribeFromTopic = React.useCallback(
    (topic: string) => {
      if (readyState === ReadyState.OPEN) {
        sendMessage(
          JSON.stringify({
            method: "unsubscribe",
            topic,
          }),
        )
      }
    },
    [readyState, sendMessage],
  )

  return { subscribeToTopic, unsubscribeFromTopic, readyState }
}
