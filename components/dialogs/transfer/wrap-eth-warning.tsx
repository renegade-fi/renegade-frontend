import { Token } from "@renegade-fi/react"
import { AlertTriangle } from "lucide-react"
import { formatUnits } from "viem/utils"

import {
  ResponsiveTooltip,
  ResponsiveTooltipContent,
  ResponsiveTooltipTrigger,
} from "@/components/ui/responsive-tooltip"

import { useUSDPrice } from "@/hooks/use-usd-price"
import { formatCurrencyFromString, formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"

export function WrapEthWarning({
  remainingEthBalance,
  minEthToKeepUnwrapped,
}: {
  remainingEthBalance: bigint
  minEthToKeepUnwrapped: bigint
}) {
  const formattedRemainingEthBalance = formatNumber(
    remainingEthBalance,
    18,
    true,
  )

  const weth = Token.findByTicker("WETH")
  const usdValue = useUSDPrice(weth, remainingEthBalance)
  const formattedUsdValue = formatUnits(usdValue, weth.decimals)
  const formattedUsdValueLabel = formatCurrencyFromString(formattedUsdValue)

  let className: string
  let mainText: string
  let tooltipText: string

  if (remainingEthBalance < BigInt(0)) {
    className = "bg-[#2A0000] text-red-400"
    mainText = "Insufficient ETH balance"
    tooltipText = `You don't have enough ETH to cover the transaction and gas fees.`
  } else if (remainingEthBalance === BigInt(0)) {
    className = "bg-[#2A0000] text-red-500"
    mainText = "Transaction will result in 0 ETH balance"
    tooltipText = "You will have no ETH left to cover gas fees."
  } else if (remainingEthBalance < minEthToKeepUnwrapped) {
    className = "bg-[#2A0000] text-red-400"
    mainText = "Transaction will result in very low ETH balance"
    tooltipText = `You will have ${formattedRemainingEthBalance} ETH (${formattedUsdValueLabel}) after wrapping`
  } else {
    className = "bg-[#2A1700] text-orange-400"
    mainText = `Transaction will wrap ETH to WETH`
    tooltipText = `You will have ${formattedRemainingEthBalance} ETH (${formattedUsdValueLabel}) after wrapping`
  }

  return (
    <div
      className={cn(
        "flex w-full items-center justify-center rounded-md p-3 text-center text-sm",
        className,
      )}
    >
      <ResponsiveTooltip>
        <ResponsiveTooltipTrigger>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-pretty">{mainText}</span>
          </div>
        </ResponsiveTooltipTrigger>
        <ResponsiveTooltipContent>{tooltipText}</ResponsiveTooltipContent>
      </ResponsiveTooltip>
    </div>
  )
}
