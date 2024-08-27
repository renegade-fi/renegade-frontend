import { GlowText } from "@/components/glow-text"
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
      <div className={cn("flex justify-between transition-colors")}>
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
        <GlowText
          className="bg-green-price"
          enabled={!!predictedSavings && !!amount && savingsLabel !== "$0.00"}
          text={savingsLabel}
        />
      </div>
    </>
  )
}
