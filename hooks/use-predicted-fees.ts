import React from "react"

import { Token } from "@renegade-fi/react"

import { NewOrderFormProps } from "@/app/trade/[base]/components/new-order/new-order-form"

import { useSavings } from "@/hooks/use-savings-query"
import { PROTOCOL_FEE, RELAYER_FEE } from "@/lib/constants/protocol"
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

  // TODO: [PERFORMANCE] baseAmount triggers render each time price changes, should debounce price s.t. it changes every 10s
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

  const { data } = useSavings({
    amount: baseAmount,
    base,
    isSell,
    isUSDCDenominated,
  })
  const lastSavings = React.useRef(data?.savings ?? 0)
  React.useEffect(() => {
    if (data?.savings && lastSavings.current !== data.savings) {
      lastSavings.current = data?.savings
    }
  }, [data?.savings])

  return {
    ...feesCalculation,
    predictedSavings: lastSavings.current,
  }
}
