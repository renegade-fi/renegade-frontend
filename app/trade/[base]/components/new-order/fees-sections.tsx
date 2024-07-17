import { useMemo } from "react"

import { Token, parseAmount } from "@renegade-fi/react"

import { GlowText } from "@/components/glow-text"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { usePredictedSavings } from "@/hooks/use-predicted-savings"
import {
  PROTOCOL_FEE,
  RELAYER_FEE,
  RENEGADE_PROTOCOL_FEE_RATE,
  RENEGADE_RELAYER_FEE_RATE,
} from "@/lib/constants/protocol"
import {
  FEES_SECTION_FEES,
  FEES_SECTION_TOTAL_SAVINGS,
} from "@/lib/constants/tooltips"
import { formatCurrency } from "@/lib/format"
import { Direction } from "@/lib/types"
import { cn } from "@/lib/utils"
import { usePrice } from "@/stores/price-store"

export function FeesSection({
  amount,
  base,
  isUSDCDenominated,
  side,
}: {
  amount: string
  base: string
  isUSDCDenominated?: boolean
  side: string
}) {
  const baseToken = Token.findByTicker(base)
  const quoteAddress = Token.findByTicker("USDC").address
  const price = usePrice({
    baseAddress: baseToken.address,
  })
  let baseAmount = amount
  if (isUSDCDenominated && Number(baseAmount)) {
    // TODO: [SAFETY]: Check if amount is a number
    baseAmount = (Number(amount) / price).toString()
  }
  // TODO: [SAFETY] Check if amount is a number
  const usdPrice = price * Number(baseAmount)
  const feesCalculation = useMemo(() => {
    let res = {
      relayerFee: 0,
      protocolFee: 0,
    }
    if (!baseAmount) return res
    res.protocolFee = Number(baseAmount) * PROTOCOL_FEE
    res.relayerFee = Number(baseAmount) * RELAYER_FEE
    return res
  }, [baseAmount])

  const predictedSavings = usePredictedSavings(
    {
      base: baseToken.address,
      quote: quoteAddress,
      amount: parseAmount(baseAmount, baseToken),
      side: side === "buy" ? Direction.BUY : Direction.SELL,
    },
    RENEGADE_PROTOCOL_FEE_RATE + RENEGADE_RELAYER_FEE_RATE,
    usdPrice,
  )

  const totalFees = feesCalculation.relayerFee + feesCalculation.protocolFee
  const feeLabel = totalFees ? formatCurrency(totalFees) : "--"

  const binanceFee = 0
  const binanceFeeLabel = binanceFee ? formatCurrency(binanceFee) : "--"

  const feeDiff = binanceFee - totalFees
  // const feeDiffLabel = totalFees && binanceFee ? formatCurrency(feeDiff) : '--'
  const feeDiffLabel = predictedSavings
    ? formatCurrency(predictedSavings)
    : "--"
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
          <span>{feeLabel}</span>
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
            enabled={!!predictedSavings && feeDiffLabel !== "$0.00"}
            className="bg-green-price"
            text={feeDiffLabel}
          />
        </div>
      </TooltipProvider>
    </>
  )
}
