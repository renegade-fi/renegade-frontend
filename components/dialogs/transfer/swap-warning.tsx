import { LiFiStep } from "@lifi/sdk"
import { Info, Loader2 } from "lucide-react"

import {
  ResponsiveTooltip,
  ResponsiveTooltipContent,
  ResponsiveTooltipTrigger,
} from "@/components/ui/responsive-tooltip"

import { formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"

export function SwapWarning({
  quote,
  remainingBalance,
}: {
  quote?: LiFiStep
  remainingBalance: bigint
}) {
  if (!quote)
    return (
      <div
        className={cn(
          "flex w-full items-center justify-center text-pretty rounded-md bg-[#00183e] p-3 text-sm text-blue",
        )}
      >
        <div className="flex w-full items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="animate-pulse">Fetching quote...</span>
        </div>
      </div>
    )
  const fromTicker = quote.action.fromToken.symbol
  const toTicker = quote.action.toToken.symbol
  const fromAmount = quote.estimate.fromAmount
  const formattedFromAmount = formatNumber(
    BigInt(fromAmount ?? 0),
    quote.action.fromToken.decimals,
    true,
  )
  const toAmount = quote.estimate.toAmount
  const formattedToAmount = formatNumber(
    BigInt(toAmount ?? 0),
    quote.action.toToken.decimals,
    true,
  )

  const formattedRemainingBalance = formatNumber(
    remainingBalance,
    quote.action.fromToken.decimals,
    true,
  )

  let className: string
  let mainText: string
  let tooltipText: string

  className = "bg-[#00183e] text-blue"
  mainText = `This will swap ${formattedFromAmount} ${fromTicker} to ${formattedToAmount} ${toTicker}`
  tooltipText = `You will have ${formattedRemainingBalance} ${toTicker} after swapping`

  return (
    <div
      className={cn(
        "flex w-full items-center text-pretty rounded-md p-3 text-sm",
        className,
      )}
    >
      <ResponsiveTooltip>
        <ResponsiveTooltipTrigger>
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            {mainText}
          </div>
        </ResponsiveTooltipTrigger>
        <ResponsiveTooltipContent>{tooltipText}</ResponsiveTooltipContent>
      </ResponsiveTooltip>
    </div>
  )
}
