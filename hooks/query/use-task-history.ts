import { Task } from "@renegade-fi/react"
import {
  getTaskHistory,
  GetTaskHistoryParameters,
  GetTaskHistoryReturnType,
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

import { useTaskHistoryWebSocket } from "./use-task-history-websocket"

export function taskHistoryQueryKey(options: CachedWallet) {
  return [
    "task-history",
    {
      scopeKey: options.id,
    },
  ] as QueryKey
}

type UseTaskHistoryParameters<TData = GetTaskHistoryReturnType> = {
  query?: Partial<UseQueryOptions<GetTaskHistoryReturnType, Error, TData>>
} & GetTaskHistoryParameters

export function useTaskHistory<TData = GetTaskHistoryReturnType>(
  parameters?: UseTaskHistoryParameters<TData>,
) {
  const queryClient = useQueryClient()
  const currentWallet = useCurrentWallet()
  const config = useConfig()
  const queryKey = taskHistoryQueryKey(currentWallet)
  const enabled = Boolean(currentWallet.seed && currentWallet.id)

  useTaskHistoryWebSocket({
    onUpdate: (incoming: Task) => {
      if (queryKey) {
        const existingMap =
          queryClient.getQueryData<GetTaskHistoryReturnType>(queryKey) ||
          new Map()
        const existingTask = existingMap.get(incoming.id)

        if (!existingTask || incoming.state !== existingTask.state) {
          const newMap = new Map(existingMap)
          newMap.set(incoming.id, incoming)
          queryClient.setQueryData(queryKey, newMap)
        }
      }
    },
  })

  return useQuery<GetTaskHistoryReturnType, Error, TData>({
    queryKey,
    queryFn: async () => {
      if (!currentWallet.seed || !currentWallet.id || !config)
        throw new Error("No wallet found in storage")
      return getTaskHistory(config)
    },
    enabled,
    ...parameters?.query,
  })
}
