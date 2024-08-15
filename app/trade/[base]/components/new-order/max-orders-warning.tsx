import { AlertTriangle } from "lucide-react"

import { useIsMaxOrders } from "@/app/trade/[base]/components/new-order/use-is-max-orders"

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { MAX_ORDERS_TOOLTIP } from "@/lib/constants/tooltips"
import { cn } from "@/lib/utils"

export function MaxOrdersWarning({ className }: { className?: string }) {
  const isMaxOrders = useIsMaxOrders()

  if (isMaxOrders) {
    return (
      <div className="rounded-md bg-[#2A1700] p-2 text-center">
        <Tooltip>
          <TooltipTrigger onClick={(e) => e.preventDefault()}>
            <div className={cn("flex items-center gap-2", className)}>
              <AlertTriangle className="h-4 w-4" />
              <span>Maximum order limit reached.</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{MAX_ORDERS_TOOLTIP}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    )
  }

  return null
}
