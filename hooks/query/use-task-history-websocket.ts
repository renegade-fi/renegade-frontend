import React from "react"

import {
  createSignedWebSocketRequest,
  Task,
  useWasmInitialized,
} from "@renegade-fi/react"
import { getSymmetricKey } from "@renegade-fi/react/actions"
import { WS_TASK_HISTORY_ROUTE } from "@renegade-fi/react/constants"
import useWebSocket, { ReadyState } from "react-use-websocket"

import { useConfig, useCurrentWallet } from "@/providers/state-provider/hooks"

import { parseBigJSON } from "./utils"

export type UseTaskHistoryWebsocketParameters = {
  onUpdate: (task: Task) => void
}

export function useTaskHistoryWebSocket(
  parameters: UseTaskHistoryWebsocketParameters,
) {
  const { onUpdate } = parameters
  const isWasmInitialized = useWasmInitialized()
  const { id: walletId } = useCurrentWallet()
  const config = useConfig()

  const url = config?.getWebsocketBaseUrl() ?? ""
  const enabled = Boolean(url && config)

  const { readyState, sendJsonMessage } = useWebSocket(
    url,
    {
      filter: () => false,
      onMessage(event) {
        try {
          const messageData = parseBigJSON(event.data)
          if (
            walletId &&
            messageData.topic === WS_TASK_HISTORY_ROUTE(walletId) &&
            messageData.event?.type === "TaskHistoryUpdate" &&
            messageData.event?.task
          )
            onUpdate?.(messageData.event.task)
        } catch (_) {}
      },
      share: true,
      shouldReconnect: () => false,
    },
    enabled,
  )

  React.useEffect(() => {
    console.trace()
    if (!enabled || readyState !== ReadyState.OPEN || !isWasmInitialized) return

    // Subscribe to wallet updates
    const body = {
      method: "subscribe",
      topic: WS_TASK_HISTORY_ROUTE(config?.state.id!),
    } as const

    const symmetricKey = getSymmetricKey(config!)
    const subscriptionMessage = createSignedWebSocketRequest(
      config!,
      symmetricKey,
      body,
    )

    sendJsonMessage(subscriptionMessage)
  }, [config, enabled, isWasmInitialized, readyState, sendJsonMessage])
}
