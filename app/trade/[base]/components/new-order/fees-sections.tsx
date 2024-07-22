import { GlowText } from "@/components/glow-text"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import {
  FEES_SECTION_FEES,
  FEES_SECTION_TOTAL_SAVINGS,
} from "@/lib/constants/tooltips"
import { formatCurrency } from "@/lib/format"
import { cn } from "@/lib/utils"

export function FeesSection({
  predictedSavings,
  relayerFee,
  protocolFee,
  amount,
}: {
  predictedSavings: number
  relayerFee: number
  protocolFee: number
  amount: number
}) {
  const totalFees = relayerFee + protocolFee
  const feeLabel = totalFees ? formatCurrency(totalFees) : "--"

  const binanceFee = 0
  const binanceFeeLabel = binanceFee ? formatCurrency(binanceFee) : "--"

  const feeDiff = binanceFee - totalFees
  const savingsLabel =
    predictedSavings && amount ? formatCurrency(predictedSavings) : "--"
  return (
    <>
      <TooltipProvider>
        <div className={cn("flex justify-between transition-colors")}>
          <Tooltip>
            <TooltipTrigger>
              <span>Fees</span>
            </TooltipTrigger>
            <TooltipContent>
              <p>{FEES_SECTION_FEES}</p>
            </TooltipContent>
          </Tooltip>
          <span>{amount ? feeLabel : "--"}</span>
        </div>
        {/* <div className={cn('flex justify-between transition-colors')}>
          <Tooltip>
            <TooltipTrigger>
              <span>Estimated Binance fees</span>
            </TooltipTrigger>
            <TooltipContent>
              <p>{FEES_SECTION_BINANCE_FEES}</p>
            </TooltipContent>
          </Tooltip>
          <span>{binanceFeeLabel}</span>
        </div> */}
        <div
          className={cn("flex justify-between transition-colors", {
            "font-bold": !!totalFees && !!binanceFee,
          })}
        >
          <Tooltip>
            <TooltipTrigger>
              <span>Total savings vs. Binance</span>
            </TooltipTrigger>
            <TooltipContent>
              <p>{FEES_SECTION_TOTAL_SAVINGS}</p>
            </TooltipContent>
          </Tooltip>
          <GlowText
            enabled={!!predictedSavings && !!amount && savingsLabel !== "$0.00"}
            className="bg-green-price"
            text={savingsLabel}
          />
        </div>
      </TooltipProvider>
    </>
  )
}
