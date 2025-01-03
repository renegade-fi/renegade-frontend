import { HistoricalStateClient } from "@renegade-fi/internal-sdk"
import {
  Config,
  OrderMetadata,
  useConfig,
  UseOrderHistoryParameters,
  UseOrderHistoryReturnType,
  useOrderHistoryWebSocket,
  useStatus,
  useQuery,
} from "@renegade-fi/react"
import {
  GetOrderHistoryData,
  GetOrderHistoryQueryKey,
  getOrderHistoryQueryOptions,
} from "@renegade-fi/react/query"
import { useQueryClient } from "@tanstack/react-query"

export function useOrderHistory<selectData = GetOrderHistoryData>(
  parameters: UseOrderHistoryParameters<selectData> = {},
): UseOrderHistoryReturnType<selectData> {
  const { query = {} } = parameters

  const config = useConfig(parameters)
  const status = useStatus(parameters)
  const queryClient = useQueryClient()

  const baseOptions = getOrderHistoryQueryOptions(config, {
    ...parameters,
  })
  const options = {
    ...baseOptions,
    queryFn: getHistoricalStateOrderHistoryQueryFn(config),
  }

  const enabled = Boolean(status === "in relayer" && (query.enabled ?? true))

  useOrderHistoryWebSocket({
    enabled,
    onUpdate: (incoming: OrderMetadata) => {
      if (queryClient && options.queryKey) {
        const existingMap =
          queryClient.getQueryData<GetOrderHistoryData>(options.queryKey) ||
          new Map()
        const existingOrder = existingMap.get(incoming.id)

        if (!existingOrder || incoming.state !== existingOrder.state) {
          const newMap = new Map(existingMap)
          newMap.set(incoming.id, incoming)
          queryClient.setQueryData(options.queryKey, newMap)
        }
      }
    },
  })

  return useQuery({ ...query, ...options, enabled })
}

function getHistoricalStateOrderHistoryQueryFn(config: Config) {
  return async function queryFn({
    queryKey,
  }: {
    queryKey: GetOrderHistoryQueryKey
  }) {
    const { scopeKey: _ } = queryKey[1]

    const hseClient = new HistoricalStateClient(
      process.env.NEXT_PUBLIC_HISTORICAL_STATE_URL,
      config,
    )
    const history = await hseClient.getOrderHistory()

    return history ?? null
  }
}
