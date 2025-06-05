import { useWalletWebsocket } from "@renegade-fi/react"
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

import { getConfig } from "@/providers/renegade-provider/config"
import { useServerStore } from "@/providers/state-provider/server-store-provider"

import { WalletData } from "./utils"

export function walletQueryKey(options: WalletData) {
  return [
    "backOfQueueWallet",
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
  const cachedWallet = useServerStore((state) => state.wallet)
  const queryKey = walletQueryKey(cachedWallet)
  const enabled = Boolean(
    cachedWallet.seed && cachedWallet.chainId && cachedWallet.id,
  )

  useWalletWebsocket({
    seed: cachedWallet.seed,
    walletId: cachedWallet.id,
    chainId: cachedWallet.chainId,
    onUpdate: (wallet) => {
      if (wallet && queryClient && queryKey) {
        queryClient.setQueryData(queryKey, wallet)
      }
    },
  })

  return useQuery<GetBackOfQueueWalletReturnType, Error, TData>({
    queryKey,
    queryFn: async () => {
      if (!cachedWallet.seed || !cachedWallet.chainId || !cachedWallet.id)
        throw new Error("Wallet not found")
      const config = getConfig({
        seed: cachedWallet.seed,
        chainId: cachedWallet.chainId,
        id: cachedWallet.id,
      })
      return getBackOfQueueWallet(config)
    },
    enabled,
    ...options?.query,
  })
}
