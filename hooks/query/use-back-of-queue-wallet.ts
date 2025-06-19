import {
  getBackOfQueueWallet,
  GetBackOfQueueWalletReturnType,
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

import { useWalletWebsocket } from "./use-wallet-websocket"

export function walletQueryKey(options: CachedWallet) {
  return [
    "back-of-queue-wallet",
    {
      scopeKey: options.id,
    },
  ] as QueryKey
}

export function useBackOfQueueWallet<
  TData = GetBackOfQueueWalletReturnType,
>(options?: {
  query?: Partial<UseQueryOptions<GetBackOfQueueWalletReturnType, Error, TData>>
}) {
  const queryClient = useQueryClient()
  const currentWallet = useCurrentWallet()
  const config = useConfig()
  const queryKey = walletQueryKey(currentWallet)
  const enabled = Boolean(currentWallet.seed && currentWallet.id)

  useWalletWebsocket({
    onUpdate: (wallet) => {
      if (wallet && queryClient && queryKey) {
        queryClient.setQueryData(queryKey, wallet)
      }
    },
  })

  return useQuery<GetBackOfQueueWalletReturnType, Error, TData>({
    queryKey,
    queryFn: async () => {
      if (!currentWallet.seed || !currentWallet.id || !config)
        throw new Error("No wallet found in storage")
      return getBackOfQueueWallet(config)
    },
    enabled,
    ...options?.query,
  })
}
