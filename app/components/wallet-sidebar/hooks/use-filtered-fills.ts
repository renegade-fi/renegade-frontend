import React from "react"

import { OrderState, useOrderHistory } from "@renegade-fi/react"

import { useLastVisit } from "@/app/components/track-last-visit"
import {
  useViewedFills,
  generateFillIdentifier,
} from "@/app/components/wallet-sidebar/hooks/use-viewed-fills"

export function useFilteredFills() {
  const { lastVisit } = useLastVisit()
  const { data: orders } = useOrderHistory({
    query: {
      select: (data) => {
        return Array.from(data.values()).filter((order) => {
          return order.state !== OrderState.Cancelled
        })
      },
    },
  })
  const { isFillViewed } = useViewedFills()

  const ordersWithRecentFills = React.useMemo(() => {
    if (!orders || !lastVisit) return []

    return orders
      .map((order) => ({
        ...order,
        fills: order.fills.filter((fill) => {
          const lastVisitBigInt = BigInt(lastVisit)
          return fill.price.timestamp > lastVisitBigInt
        }),
      }))
      .filter((order) => order.fills.length > 0)
      .sort((a, b) => {
        const latestFillA = a.fills[a.fills.length - 1].price.timestamp
        const latestFillB = b.fills[b.fills.length - 1].price.timestamp
        return Number(latestFillB - latestFillA)
      })
  }, [orders, lastVisit])

  const filteredOrders = ordersWithRecentFills
    .map((order) => ({
      ...order,
      fills: order.fills.filter(
        (fill) =>
          !isFillViewed(generateFillIdentifier(order.id, fill.price.timestamp)),
      ),
    }))
    .filter((order) => order.fills.length > 0)

  const totalUnviewedFills = filteredOrders.reduce(
    (acc, order) => acc + order.fills.length,
    0,
  )

  return {
    filteredOrders,
    totalUnviewedFills,
  }
}
