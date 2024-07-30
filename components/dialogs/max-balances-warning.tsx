import { useWallet } from "@renegade-fi/react"
import { MAX_BALANCES } from "@renegade-fi/react/constants"
import { AlertTriangle } from "lucide-react"
import { fromHex } from "viem"

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { MAX_BALANCES_TOOLTIP } from "@/lib/constants/tooltips"
import { cn } from "@/lib/utils"

export function MaxBalancesWarning({ className }: { className?: string }) {
  const { data: isMaxBalances } = useWallet({
    query: {
      // Select non-default balances
      select: data =>
        data.balances.filter(
          balance =>
            (!!fromHex(balance.mint, "number") && !!balance.amount) ||
            !!balance.protocol_fee_balance ||
            !!balance.relayer_fee_balance,
        ).length === MAX_BALANCES,
    },
  })

  if (isMaxBalances) {
    return (
      <Tooltip>
        <TooltipTrigger onClick={e => e.preventDefault()}>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow" />
            <span className={cn(className)}>
              You have reached the maximum number of balances ({MAX_BALANCES})
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{MAX_BALANCES_TOOLTIP}</p>
        </TooltipContent>
      </Tooltip>
    )
  }

  return null
}
