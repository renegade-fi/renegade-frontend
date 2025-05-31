"use client"

import React from "react"

import {
  OrderMetadata,
  OrderState,
  useBackOfQueueWallet,
  useOrderHistory,
  useOrderHistoryWebSocket,
} from "@renegade-fi/react"
import { toast } from "sonner"

import { formatNumber } from "@/lib/format"
import { syncOrdersWithWalletState } from "@/lib/order"
import { resolveAddress } from "@/lib/token"

export function OrderToaster() {
  const [incomingOrder, setIncomingOrder] = React.useState<OrderMetadata>()
  useOrderHistoryWebSocket({
    onUpdate: (order) => {
      setIncomingOrder(order)
    },
  })
  const orderMetadataRef = React.useRef<Map<string, OrderMetadata>>(new Map())

  const { data: orderIds } = useBackOfQueueWallet({
    query: {
      select: (data) => data.orders.map((order) => order.id),
    },
  })
  const { data } = useOrderHistory({
    query: {
      enabled: orderMetadataRef.current.size === 0,
      select: (data) =>
        syncOrdersWithWalletState({ orders: data, walletOrderIds: orderIds }),
    },
  })

  React.useEffect(() => {
    if (data && orderMetadataRef.current.size === 0) {
      data.forEach((order) => {
        orderMetadataRef.current.set(order.id, order)
      })
    }
  }, [data])

  React.useEffect(() => {
    if (incomingOrder) {
      const existingOrder = orderMetadataRef.current.get(incomingOrder.id)

      // Ignore duplicate events
      if (existingOrder?.state === incomingOrder.state) {
        return
      }

      orderMetadataRef.current.set(incomingOrder.id, incomingOrder)

      const {
        fills,
        state,
        data: { base_mint, side, amount },
      } = incomingOrder
      const base = resolveAddress(base_mint)
      const formattedAmount = formatNumber(amount, base.decimals)
      const prevFills = existingOrder?.fills || []

      if (state === OrderState.Filled) {
        toast.success(
          `Order completely filled: ${
            side === "Buy" ? "Bought" : "Sold"
          } ${formattedAmount} ${base.ticker}`,
        )
      } else if (fills.length > prevFills.length) {
        const sortedFills = fills.sort((a, b) =>
          a.price.timestamp > b.price.timestamp ? 1 : -1,
        )
        const currentFill = sortedFills[sortedFills.length - 1].amount
        const formattedCurrentFill = formatNumber(currentFill, base.decimals)
        toast.success(
          `Order partially filled: ${
            side === "Buy" ? "Bought" : "Sold"
          } ${formattedCurrentFill} ${base.ticker}`,
        )
      }
    }
  }, [incomingOrder])

  return null
}
