import {
  Order,
  OrderMetadata,
  Token,
  useConfig,
  useTaskHistory,
} from "@renegade-fi/react"
import { cancelOrder } from "@renegade-fi/react/actions"
import { toast } from "sonner"

import {
  FAILED_CANCEL_ORDER_MSG,
  QUEUED_CANCEL_ORDER_MSG,
} from "@/lib/constants/task"

export function useCancelOrder({ order }: { order: OrderMetadata }) {
  const config = useConfig()
  const { data: isQueue } = useTaskHistory({
    query: {
      select: data => {
        return Array.from(data.values()).some(
          task => task.state !== "Completed" && task.state !== "Failed",
        )
      },
    },
  })

  const handleCancel = async ({
    onSuccess,
  }: { onSuccess?: () => void } = {}) => {
    if (!order.id) return
    const token = Token.findByAddress(order.data.base_mint)
    if (isQueue) {
      toast.message(
        QUEUED_CANCEL_ORDER_MSG(token, order.data.amount, order.data.side),
      )
    }

    // Cancel
    await cancelOrder(config, { id: order.id })
      .then(onSuccess)
      .catch(e => {
        console.error(`Error cancelling order ${e.response?.data ?? e.message}`)
        toast.error(
          FAILED_CANCEL_ORDER_MSG(token, order.data.amount, order.data.side),
        )
      })
  }

  return { handleCancel }
}
