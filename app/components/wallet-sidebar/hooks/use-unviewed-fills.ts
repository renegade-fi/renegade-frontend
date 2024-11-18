import React from "react"

import { OrderMetadata, useOrderHistory } from "@renegade-fi/react"

import {
  generateFillIdentifier,
  useViewedFills,
} from "@/app/components/wallet-sidebar/hooks/use-viewed-fills"

import { useClientStore } from "@/providers/state-provider/client-store-provider.tsx"

export function useRecentUnviewedFills() {
  const { lastVisitTs } = useClientStore((state) => state)
  const lastVisitBigInt = React.useMemo(
    () => (lastVisitTs ? BigInt(lastVisitTs) : null),
    [lastVisitTs],
  )

  const { data: orders } = useOrderHistory({
    query: {
      select: (data) => {
        if (!lastVisitBigInt) return []

        const filteredOrders: OrderMetadata[] = []

        for (const order of data.values()) {
          const latestFill = order.fills[order.fills.length - 1]
          if (!latestFill || latestFill.price.timestamp <= lastVisitBigInt) {
            continue
          }

          const recentFills = order.fills.filter(
            (fill) => fill.price.timestamp > lastVisitBigInt,
          )

          if (recentFills.length > 0) {
            filteredOrders.push({
              ...order,
              fills: recentFills,
            })
          }
        }

        return filteredOrders.sort((a, b) => {
          const latestFillA = a.fills[a.fills.length - 1].price.timestamp
          const latestFillB = b.fills[b.fills.length - 1].price.timestamp
          return Number(latestFillB - latestFillA)
        })
      },
    },
  })

  const { isFillViewed } = useViewedFills()

  const filteredOrders = React.useMemo(() => {
    if (!orders) return []

    return orders
      .map((order) => ({
        ...order,
        fills: order.fills.filter(
          (fill) =>
            !isFillViewed(
              generateFillIdentifier(order.id, fill.price.timestamp),
            ),
        ),
      }))
      .filter((order) => order.fills.length > 0)
  }, [orders, isFillViewed])

  const totalUnviewedFills = React.useMemo(
    () => filteredOrders.reduce((acc, order) => acc + order.fills.length, 0),
    [filteredOrders],
  )

  return {
    filteredOrders,
    totalUnviewedFills,
  }
}
