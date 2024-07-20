import { OrderMetadata, OrderState } from "@renegade-fi/react"
import { AlertTriangle, CheckIcon, X } from "lucide-react"

import { formatOrderState } from "@/lib/format"
import { cn } from "@/lib/utils"

const HIDDEN_STATES = [
  OrderState.Created,
  OrderState.Matching,
  OrderState.SettlingMatch,
]
export function OrderStatusIndicator({ order }: { order: OrderMetadata }) {
  const status = formatOrderState(order.state)
  const Icon = {
    [OrderState.Created]: AlertTriangle,
    [OrderState.Matching]: AlertTriangle,
    [OrderState.Cancelled]: X,
    [OrderState.Filled]: CheckIcon,
    [OrderState.SettlingMatch]: AlertTriangle,
  }[order.state]

  if (HIDDEN_STATES.includes(order.state)) return null
  return (
    <div className="flex items-center gap-2">
      <Icon
        className={cn("h-4 w-4", {
          "text-red-price": order.state === OrderState.Cancelled,
          "text-green-price": order.state === OrderState.Filled,
        })}
      />
      <div className="flex-1 border-0 text-sm font-bold">
        {status.toUpperCase()}
      </div>
    </div>
  )
}
