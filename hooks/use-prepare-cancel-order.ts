"use client"

import { ConfigRequiredError } from "@renegade-fi/react"
import { CancelOrderParameters } from "@renegade-fi/react/actions"
import { useQuery } from "@tanstack/react-query"

import { useBackOfQueueWallet } from "@/hooks/query/use-back-of-queue-wallet"
import { useConfig } from "@/providers/renegade-provider/config-provider"

import { stringifyForWasm } from "./query/utils"

export type UsePrepareCancelOrderParameters = CancelOrderParameters

export function usePrepareCancelOrder(
  parameters: UsePrepareCancelOrderParameters,
) {
  const { id } = parameters
  const config = useConfig()
  const { data: wallet, isSuccess } = useBackOfQueueWallet()

  return useQuery({
    queryKey: ["prepare", "cancel-order", parameters],
    queryFn: async () => {
      if (!config) throw new ConfigRequiredError("usePrepareCancelOrder")
      if (!config.state.seed) throw new Error("Seed is required")
      if (!isSuccess) return undefined
      if (wallet.orders.find((order) => order.id === id)) {
        return config.utils.cancel_order(
          config.state.seed,
          stringifyForWasm(wallet),
          id,
        )
      }
      return null
    },
    enabled: Boolean(config?.state.seed),
  })
}
