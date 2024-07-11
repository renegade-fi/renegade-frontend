import { useMemo } from 'react'

import { PROTOCOL_FEE, RELAYER_FEE } from '@/lib/constants/protocol'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'

import { GlowText } from '@/components/glow-text'

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
  const feeLabel = totalFees > 0 ? formatCurrency(totalFees) : '--'

  const binanceFee = 0
  const binanceFeeLabel = binanceFee > 0 ? formatCurrency(binanceFee) : '--'

  const feeDiff = binanceFee - totalFees
  const feeDiffLabel = totalFees && binanceFee ? formatCurrency(feeDiff) : '--'
  return (
    <>
      <div className="flex justify-between">
        <span>Est. fees for your order</span>
        <span>{feeLabel}</span>
      </div>
      <div className="flex justify-between">
        <span>Est. cost to trade on Binance</span>
        <span>{binanceFeeLabel}</span>
      </div>
      <div
        className={cn('flex justify-between ', {
          'font-bold': !!totalFees && !!binanceFee,
        })}
      >
        <span>Total savings vs. Binance</span>
        <GlowText
          enabled={!!totalFees && !!binanceFee}
          className="bg-green-price"
          text={feeDiffLabel}
        />
      </div>
    </>
  )
}
