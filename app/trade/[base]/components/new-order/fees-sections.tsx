import { useMemo } from 'react'

import { Token } from '@renegade-fi/react'

import { GlowText } from '@/components/glow-text'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

import { PROTOCOL_FEE, RELAYER_FEE } from '@/lib/constants/protocol'
import {
  FEES_SECTION_BINANCE_FEES,
  FEES_SECTION_FEES,
  FEES_SECTION_TOTAL_SAVINGS,
} from '@/lib/constants/tooltips'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'
import { usePrice } from '@/stores/price-store'

export function FeesSection({
  amount,
  base,
  isUSDCDenominated,
}: {
  amount: string
  base: string
  isUSDCDenominated?: boolean
}) {
  const price = usePrice({
    baseAddress: Token.findByTicker(base).address,
  })
  // TODO: [SAFETY] Check if amount is a number
  const usdPrice = price * Number(amount)
  const feesCalculation = useMemo(() => {
    let res = {
      relayerFee: 0,
      protocolFee: 0,
    }
    if (!amount) return res
    if (isUSDCDenominated) {
      res.relayerFee = Number(amount) * RELAYER_FEE
      res.protocolFee = Number(amount) * PROTOCOL_FEE
    } else {
      res.relayerFee = usdPrice * RELAYER_FEE
      res.protocolFee = usdPrice * PROTOCOL_FEE
    }
    return res
  }, [amount, isUSDCDenominated, usdPrice])

  const totalFees = feesCalculation.relayerFee + feesCalculation.protocolFee
  const feeLabel = totalFees ? formatCurrency(totalFees) : '--'

  const binanceFee = 0
  const binanceFeeLabel = binanceFee ? formatCurrency(binanceFee) : '--'

  const feeDiff = binanceFee - totalFees
  const feeDiffLabel = totalFees && binanceFee ? formatCurrency(feeDiff) : '--'
  return (
    <>
      <TooltipProvider>
        <div className={cn('flex justify-between transition-colors')}>
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
        <div className={cn('flex justify-between transition-colors')}>
          <Tooltip>
            <TooltipTrigger>
              <span>Estimated Binance fees</span>
            </TooltipTrigger>
            <TooltipContent>
              <p>{FEES_SECTION_BINANCE_FEES}</p>
            </TooltipContent>
          </Tooltip>
          <span>{binanceFeeLabel}</span>
        </div>
        <div
          className={cn('flex justify-between transition-colors', {
            'font-bold': !!totalFees && !!binanceFee,
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
            enabled={!!totalFees && !!binanceFee}
            className="bg-green-price"
            text={feeDiffLabel}
          />
        </div>
      </TooltipProvider>
    </>
  )
}
