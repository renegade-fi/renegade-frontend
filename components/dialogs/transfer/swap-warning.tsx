import { LiFiStep } from "@lifi/sdk"
import { Info } from "lucide-react"

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
  const className = "bg-[#2A0000] text-orange-400"
  if (!quote)
    return (
      <div
        className={cn(
          "flex w-full animate-pulse items-center justify-center rounded-md p-3 text-sm",
          className,
        )}
      >
        <span>Fetching quote...</span>
      </div>
    )

  const { fromToken, toToken } = quote.action
  const { fromAmount, toAmountMin } = quote.estimate

  const formattedFromAmount = formatNumber(
    BigInt(fromAmount ?? 0),
    fromToken.decimals,
    true,
  )
  const formattedToAmount = formatNumber(
    BigInt(toAmountMin ?? 0),
    toToken.decimals,
    true,
  )
  const formattedRemainingBalance = formatNumber(
    remainingBalance,
    fromToken.decimals,
    true,
  )

  const mainText = `This will swap ${formattedFromAmount} ${fromToken.symbol} to ${formattedToAmount} ${toToken.symbol}`
  const tooltipText = `You will have ${formattedRemainingBalance} ${fromToken.symbol} after swapping`

  return (
    <div
      className={cn(
        "flex w-full items-center justify-center rounded-md p-3 text-sm",
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
