import { AlertTriangle } from "lucide-react"

import { useIsMaxOrders } from "@/app/trade/[base]/components/new-order/use-is-max-orders"

import {
  ResponsiveTooltip,
  ResponsiveTooltipContent,
  ResponsiveTooltipTrigger,
} from "@/components/ui/responsive-tooltip"

import { useMediaQuery } from "@/hooks/use-media-query"
import { MAX_ORDERS_TOOLTIP } from "@/lib/constants/tooltips"
import { cn } from "@/lib/utils"

export function MaxOrdersWarning({ className }: { className?: string }) {
  const isMaxOrders = useIsMaxOrders()
  const isDesktop = useMediaQuery("(min-width: 1024px)")

  if (isMaxOrders) {
    return (
      <div className="flex w-full items-center justify-center rounded-md bg-[#2A1700] p-3 text-center">
        <ResponsiveTooltip>
          <ResponsiveTooltipTrigger
            onClick={(e) => isDesktop && e.preventDefault()}
          >
            <div className={cn("flex items-center gap-2", className)}>
              <AlertTriangle className="h-4 w-4" />
              <span>Maximum order limit reached.</span>
            </div>
          </ResponsiveTooltipTrigger>
          <ResponsiveTooltipContent>
            <p>{MAX_ORDERS_TOOLTIP}</p>
          </ResponsiveTooltipContent>
        </ResponsiveTooltip>
      </div>
    )
  }

  return null
}
