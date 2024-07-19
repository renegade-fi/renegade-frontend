import React from "react"

import { Token, parseAmount } from "@renegade-fi/react"

import { NewOrderFormProps } from "@/app/trade/[base]/components/new-order/new-order-form"

import { usePredictedSavings } from "@/hooks/use-predicted-savings"
import {
  PROTOCOL_FEE,
  RELAYER_FEE,
  RENEGADE_PROTOCOL_FEE_RATE,
  RENEGADE_RELAYER_FEE_RATE,
} from "@/lib/constants/protocol"
import { Direction } from "@/lib/types"
import { usePrice } from "@/stores/price-store"

export function usePredictedFees({
  amount,
  base,
  isSell,
  isUSDCDenominated,
}: NewOrderFormProps) {
  const baseToken = Token.findByTicker(base)
  const quoteAddress = Token.findByTicker("USDC").address
  const price = usePrice({
    baseAddress: baseToken.address,
  })

  const usdPrice = React.useMemo(() => {
    if (!price) return 0
    if (isUSDCDenominated) {
      return amount
    }
    return amount * price
  }, [amount, isUSDCDenominated, price])

  const baseAmount = React.useMemo(() => {
    if (!price) return 0
    if (isUSDCDenominated) {
      return amount / price
    }
    return amount
  }, [amount, isUSDCDenominated, price])

  const feesCalculation = React.useMemo(() => {
    let res = {
      relayerFee: 0,
      protocolFee: 0,
    }
    if (!usdPrice) return res
    res.protocolFee = usdPrice * PROTOCOL_FEE
    res.relayerFee = usdPrice * RELAYER_FEE
    return res
  }, [usdPrice])

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

  return {
    ...feesCalculation,
    predictedSavings,
  }
}
