import MotionNumber from "motion-number"

import {
  Tooltip,
  TooltipContent,
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
  amount: string
}) {
  const totalFees = relayerFee + protocolFee
  const feeLabel = totalFees ? formatCurrency(totalFees) : "--"

  const savingsLabel =
    predictedSavings && amount ? formatCurrency(predictedSavings) : "--"
  return (
    <>
      <div className={cn("flex justify-between transition-colors")}>
        <Tooltip>
          <TooltipTrigger onClick={(e) => e.preventDefault()}>
            <span className="text-muted-foreground">Fee</span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{FEES_SECTION_FEES}</p>
          </TooltipContent>
        </Tooltip>
        <span>{amount ? feeLabel : "--"}</span>
      </div>
      <div className={cn("relative flex justify-between transition-colors")}>
        <Tooltip>
          <TooltipTrigger>
            <span className="text-muted-foreground">
              Total savings vs. Binance
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{FEES_SECTION_TOTAL_SAVINGS}</p>
          </TooltipContent>
        </Tooltip>
        <MotionNumber
          className={cn("text-green-price transition-opacity", {
            "opacity-0": !predictedSavings || !amount,
          })}
          format={{
            style: "currency",
            currency: "USD",
            minimumFractionDigits:
              predictedSavings > 10_000 ? 0 : predictedSavings < 10 ? 4 : 2,
            maximumFractionDigits:
              predictedSavings > 10_000 ? 0 : predictedSavings < 10 ? 4 : 2,
          }}
          locales="en-US"
          value={predictedSavings}
        />
        <span
          className={cn("absolute right-0 transition-opacity", {
            "opacity-0": predictedSavings && amount,
          })}
        >
          --
        </span>
      </div>
    </>
  )
}
