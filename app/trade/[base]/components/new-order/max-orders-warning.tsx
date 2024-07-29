import { useWallet } from "@renegade-fi/react"
import { MAX_ORDERS } from "@renegade-fi/react/constants"
import { AlertTriangle } from "lucide-react"

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { MAX_ORDERS_TOOLTIP } from "@/lib/constants/tooltips"
import { cn } from "@/lib/utils"

export function MaxOrdersWarning({ className }: { className?: string }) {
  const { data: isMaxOrders } = useWallet({
    query: {
      select: data => data.orders.length === MAX_ORDERS,
    },
  })

  if (isMaxOrders) {
    return (
      <Tooltip>
        <TooltipTrigger onClick={e => e.preventDefault()}>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow" />
            <span className={cn(className)}>
              You have reached the maximum number of open orders ({MAX_ORDERS})
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{MAX_ORDERS_TOOLTIP}</p>
        </TooltipContent>
      </Tooltip>
    )
  }

  return null
}
