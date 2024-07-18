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
  isSell,
}: {
  amount: number
  base: string
  isSell: boolean
  isUSDCDenominated: boolean
}) {
  const baseToken = Token.findByTicker(base)
  const quoteAddress = Token.findByTicker("USDC").address
  const price = usePrice({
    baseAddress: baseToken.address,
  })

  let usdPrice = amount
  if (!isUSDCDenominated) {
    usdPrice = Number(amount) * price
  }

  const feesCalculation = useMemo(() => {
    let res = {
      relayerFee: 0,
      protocolFee: 0,
    }
    if (!usdPrice) return res
    res.protocolFee = Number(usdPrice) * PROTOCOL_FEE
    res.relayerFee = Number(usdPrice) * RELAYER_FEE
    return res
  }, [usdPrice])

  let baseAmount = amount
  if (isUSDCDenominated && Number(amount) && price) {
    baseAmount = Number(amount) / price
  }

  const predictedSavings = usePredictedSavings(
    {
      base: baseToken.address,
      quote: quoteAddress,
      amount: parseAmount(baseAmount.toString(), baseToken),
      side: isSell ? Direction.SELL : Direction.BUY,
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
