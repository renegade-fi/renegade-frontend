import { OrderMetadata } from "@renegade-fi/react"
import {
  getOrderHistory,
  GetOrderHistoryReturnType,
} from "@renegade-fi/react/actions"
import {
  QueryKey,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from "@tanstack/react-query"

import { useConfig } from "@/providers/state-provider/hooks"
import { useCurrentWallet } from "@/providers/state-provider/hooks"
import { CachedWallet } from "@/providers/state-provider/schema"

import { useOrderHistoryWebSocket } from "./use-order-history-websocket"

export function orderHistoryQueryKey(options: CachedWallet) {
  return [
    "order-history",
    {
      scopeKey: options.id,
    },
  ] as QueryKey
}

export function useOrderHistory<TData = GetOrderHistoryReturnType>(options?: {
  query?: Partial<UseQueryOptions<GetOrderHistoryReturnType, Error, TData>>
}) {
  const queryClient = useQueryClient()
  const currentWallet = useCurrentWallet()
  const config = useConfig()
  const queryKey = orderHistoryQueryKey(currentWallet)
  const enabled = Boolean(currentWallet.seed && currentWallet.id)

  useOrderHistoryWebSocket({
    onUpdate: (incoming: OrderMetadata) => {
      if (queryKey) {
        const existingMap =
          queryClient.getQueryData<GetOrderHistoryReturnType>(queryKey) ||
          new Map()
        const existingOrder = existingMap.get(incoming.id)

        if (!existingOrder || incoming.state !== existingOrder.state) {
          const newMap = new Map(existingMap)
          newMap.set(incoming.id, incoming)
          queryClient.setQueryData(queryKey, newMap)
        }
      }
    },
  })

  return useQuery<GetOrderHistoryReturnType, Error, TData>({
    queryKey,
    queryFn: async () => {
      if (!currentWallet.seed || !currentWallet.id || !config)
        throw new Error("No wallet found in storage")
      return getOrderHistory(config)
    },
    enabled,
    ...options?.query,
  })
}
