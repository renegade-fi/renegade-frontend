import { OrderMetadata, Token, useOrderHistory } from "@renegade-fi/react"
import { formatUnits } from "viem/utils"

import { getVWAP } from "@/lib/order"

export interface ExtendedOrderMetadata extends OrderMetadata {
  usdValue: number
}

export function useOrderTableData() {
  const { data } = useOrderHistory({
    query: {
      select: (data) => Array.from(data?.values() || []),
    },
  })

  const extendedOrders: ExtendedOrderMetadata[] = (data || []).map((order) => {
    const vwap = getVWAP(order)
    const token = Token.findByAddress(order.data.base_mint)
    const usdValue =
      vwap * Number(formatUnits(order.data.amount, token.decimals))
    return {
      ...order,
      usdValue,
    }
  })

  return extendedOrders
}
