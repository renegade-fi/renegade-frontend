import { HistoricalStateClient } from "@renegade-fi/internal-sdk"
import {
  Config,
  Task,
  useConfig,
  useQuery,
  useStatus,
  UseTaskHistoryParameters,
  UseTaskHistoryReturnType,
  useTaskHistoryWebSocket,
} from "@renegade-fi/react"
import { getTaskHistory } from "@renegade-fi/react/actions"
import {
  GetTaskHistoryData,
  GetTaskHistoryQueryKey,
  getTaskHistoryQueryOptions,
} from "@renegade-fi/react/query"
import { useQueryClient } from "@tanstack/react-query"

export function useTaskHistory<selectData = GetTaskHistoryData>(
  parameters: UseTaskHistoryParameters<selectData> = {},
): UseTaskHistoryReturnType<selectData> {
  const { query = {} } = parameters

  const config = useConfig(parameters)
  const status = useStatus(parameters)
  const queryClient = useQueryClient()

  const baseOptions = getTaskHistoryQueryOptions(config, {
    ...parameters,
  })
  const options = {
    ...baseOptions,
    queryFn: getHistoricalStateTaskHistoryQueryFn(config),
  }

  const enabled = Boolean(status === "in relayer" && (query.enabled ?? true))

  useTaskHistoryWebSocket({
    enabled,
    onUpdate: (incoming: Task) => {
      if (queryClient && options.queryKey) {
        const existingMap =
          queryClient.getQueryData<GetTaskHistoryData>(options.queryKey) ||
          new Map()
        const existingTask = existingMap.get(incoming.id)

        if (!existingTask || incoming.state !== existingTask.state) {
          const newMap = new Map(existingMap)
          newMap.set(incoming.id, incoming)
          queryClient.setQueryData(options.queryKey, newMap)
        }
      }
    },
  })

  return useQuery({ ...query, ...options, enabled })
}

function getHistoricalStateTaskHistoryQueryFn(config: Config) {
  return async function queryFn({
    queryKey,
  }: {
    queryKey: GetTaskHistoryQueryKey
  }) {
    const { scopeKey: _ } = queryKey[1]

    let history
    if (process.env.NEXT_PUBLIC_HISTORICAL_STATE_URL) {
      const hseClient = new HistoricalStateClient(
        process.env.NEXT_PUBLIC_HISTORICAL_STATE_URL,
        config,
      )

      history = await hseClient.getTaskHistory()
    } else {
      history = await getTaskHistory(config)
    }

    return history ?? null
  }
}
