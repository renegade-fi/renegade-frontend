import { OrderMetadata, useOrderHistory } from "@renegade-fi/react"
import { formatUnits } from "viem/utils"

import { useBackOfQueueWallet } from "@/hooks/query/use-back-of-queue-wallet"
import { getVWAP, syncOrdersWithWalletState } from "@/lib/order"
import { resolveAddress } from "@/lib/token"

export interface ExtendedOrderMetadata extends OrderMetadata {
  usdValue: number
}

export function useOrderTableData() {
  const { data: orderIds } = useBackOfQueueWallet({
    query: {
      select: (data) => data.orders.map((order) => order.id),
    },
  })
  const { data } = useOrderHistory({
    query: {
      select: (data) => {
        const filtered = syncOrdersWithWalletState({
          orders: data,
          walletOrderIds: orderIds,
        })
        return Array.from(filtered.values())
      },
    },
  })

  const extendedOrders: ExtendedOrderMetadata[] = (data || []).map((order) => {
    const vwap = getVWAP(order)
    const token = resolveAddress(order.data.base_mint)
    const usdValue =
      vwap * Number(formatUnits(order.data.amount, token.decimals))
    return {
      ...order,
      usdValue,
    }
  })

  return extendedOrders
}
