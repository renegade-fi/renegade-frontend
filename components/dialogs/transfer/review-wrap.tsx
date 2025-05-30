import { InfoCircledIcon } from "@radix-ui/react-icons"
import { AlertTriangle } from "lucide-react"
import { formatEther } from "viem"
import { arbitrum } from "viem/chains"

import { Row } from "@/components/dialogs/transfer/row"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { useUSDPrice } from "@/hooks/use-usd-price"
import { formatCurrencyFromString, formatNumber } from "@/lib/format"
import { resolveTickerOnChain } from "@/lib/token"
import { cn } from "@/lib/utils"

export function ReviewWrap({
  gasEstimate,
  minEthToKeepUnwrapped,
  remainingEthBalance,
  wrapAmount,
}: {
  gasEstimate?: bigint
  minEthToKeepUnwrapped: bigint
  remainingEthBalance: bigint
  wrapAmount: bigint
}) {
  const wethToken = resolveTickerOnChain("WETH", arbitrum.id)!

  const bufferedMinEthToKeepUnwrapped = BigInt(
    Math.round(Number(minEthToKeepUnwrapped) * 0.9),
  )

  const feeEstimate = useUSDPrice(wethToken, gasEstimate ?? BigInt(0))
  const formattedFeeEstimate = formatEther(feeEstimate)
  const amountUSDValue = useUSDPrice(wethToken, wrapAmount)
  const formattedAmountUSDValue = formatCurrencyFromString(
    formatEther(amountUSDValue),
  )

  const remainingUSDValue = useUSDPrice(wethToken, remainingEthBalance)
  const formattedRemainingUSDValue = formatCurrencyFromString(
    formatEther(remainingUSDValue),
  )

  let warningColor: string
  let tooltipWarningText: string

  if (remainingEthBalance < BigInt(0)) {
    warningColor = "text-red-400"
    tooltipWarningText =
      "You don't have enough ETH to cover the transaction and gas fees."
  } else if (remainingEthBalance === BigInt(0)) {
    warningColor = "text-red-500"
    tooltipWarningText = "You will have no ETH left to cover gas fees."
  } else if (remainingEthBalance < bufferedMinEthToKeepUnwrapped) {
    warningColor = "text-red-400"
    tooltipWarningText = `Warning: Low ETH balance after wrapping (${formattedRemainingUSDValue})`
  } else {
    warningColor = ""
    tooltipWarningText = `${formattedRemainingUSDValue}`
  }

  return (
    <div className="flex flex-col gap-2 border p-3 text-sm">
      <div className="space-y-3 text-left">
        <div className="flex items-center gap-2">
          <InfoCircledIcon className="h-4 w-4" />
          <span>Review wrap of ETH</span>
        </div>
      </div>
      <Row
        imageUri={wethToken.logoUrl}
        label={`Wrap ETH`}
        value={
          <Tooltip>
            <TooltipTrigger type="button">
              {formatNumber(wrapAmount, 18, true)}
            </TooltipTrigger>
            <TooltipContent side="right">
              {formattedAmountUSDValue}
            </TooltipContent>
          </Tooltip>
        }
      />
      <Row
        imageUri={wethToken.logoUrl}
        label={`Receive WETH`}
        value={
          <Tooltip>
            <TooltipTrigger type="button">
              {formatNumber(wrapAmount, 18, true)}
            </TooltipTrigger>
            <TooltipContent side="right">
              {formattedAmountUSDValue}
            </TooltipContent>
          </Tooltip>
        }
      />
      <Row
        label={`Fee Estimate`}
        value={formatCurrencyFromString(formattedFeeEstimate)}
      />
      <Row
        imageUri={wethToken.logoUrl}
        label={`ETH Remaining`}
        value={
          <Tooltip>
            <TooltipTrigger
              className="flex items-center gap-1"
              type="button"
            >
              {formatNumber(remainingEthBalance, 18, true)}
              {warningColor && (
                <AlertTriangle className={cn("size-4", warningColor)} />
              )}
            </TooltipTrigger>
            <TooltipContent side="right">{tooltipWarningText}</TooltipContent>
          </Tooltip>
        }
      />
    </div>
  )
}
