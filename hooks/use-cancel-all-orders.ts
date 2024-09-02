import { useBackOfQueueWallet, useConfig } from "@renegade-fi/react"
import { cancelOrder } from "@renegade-fi/react/actions"

export function useCancelAllOrders() {
  const config = useConfig()
  const { data } = useBackOfQueueWallet({
    query: {
      select: (data) =>
        data.orders
          .filter((order) => order.amount > 0)
          .map((order) => order.id),
    },
  })

  async function handleCancelAllOrders() {
    if (!data) return

    for (const orderId of data) {
      try {
        await cancelOrder(config, { id: orderId })
      } catch (error) {
        console.error(`Error cancelling order:`, error)
        break
      }
    }
  }

  return {
    handleCancelAllOrders,
    isDisabled: !data || data.length === 0,
  }
}
