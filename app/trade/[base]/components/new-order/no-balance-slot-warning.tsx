import { Token } from "@renegade-fi/react"
import { AlertTriangle } from "lucide-react"

import { useIsMaxBalances } from "@/components/dialogs/transfer/use-is-max-balances"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { MAX_BALANCES_PLACE_ORDER_TOOLTIP } from "@/lib/constants/tooltips"
import { cn } from "@/lib/utils"

export function NoBalanceSlotWarning({
  className,
  ticker,
  isSell,
}: {
  className?: string
  ticker: string
  isSell?: boolean
}) {
  const receiveMint = isSell
    ? Token.findByTicker("USDC")?.address
    : Token.findByTicker(ticker)?.address
  const isMaxBalances = useIsMaxBalances(receiveMint)

  if (isMaxBalances) {
    return (
      <div className="flex w-full items-center justify-center rounded-md bg-[#2A1700] p-3 text-center">
        <Tooltip>
          <TooltipTrigger onClick={(e) => e.preventDefault()}>
            <div className={cn("flex items-center gap-2", className)}>
              <AlertTriangle className="h-4 w-4" />
              <span>No balance slot available.</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{MAX_BALANCES_PLACE_ORDER_TOOLTIP}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    )
  }

  return null
}
