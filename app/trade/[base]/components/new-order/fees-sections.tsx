import { useMemo } from 'react'

import { PROTOCOL_FEE, RELAYER_FEE } from '@/lib/constants/protocol'
import {
  FEES_SECTION_BINANCE_FEES,
  FEES_SECTION_FEES,
  FEES_SECTION_TOTAL_SAVINGS,
} from '@/lib/constants/tooltips'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'

import { GlowText } from '@/components/glow-text'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export function FeesSection({
  amount,
  base,
}: {
  amount: string
  base: string
}) {
  const feesCalculation = useMemo(() => {
    if (!amount)
      return {
        relayerFee: 0,
        protocolFee: 0,
      }
    let res = {
      relayerFee: 0,
      protocolFee: 0,
    }
    if (base === 'USDC') {
      res.relayerFee = Number(amount) * RELAYER_FEE
      res.protocolFee = Number(amount) * PROTOCOL_FEE
    } else {
      // TODO: [PRICE] Calculate the price of base in USDC
    }
    return res
  }, [amount, base])

  const totalFees = feesCalculation.relayerFee + feesCalculation.protocolFee
  const feeLabel = totalFees ? formatCurrency(totalFees) : '--'

  const binanceFee = 0
  const binanceFeeLabel = binanceFee ? formatCurrency(binanceFee) : '--'

  const feeDiff = binanceFee - totalFees
  const feeDiffLabel = totalFees && binanceFee ? formatCurrency(feeDiff) : '--'
  return (
    <>
      <TooltipProvider>
        <div className={cn('flex transition-colors justify-between')}>
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
        <div className={cn('flex transition-colors justify-between ')}>
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
          className={cn('flex transition-colors justify-between ', {
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
