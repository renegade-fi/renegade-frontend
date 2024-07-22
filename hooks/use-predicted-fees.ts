import React from "react"

import { Token } from "@renegade-fi/react"
import { useDebounceValue } from "usehooks-ts"

import { NewOrderFormProps } from "@/app/trade/[base]/components/new-order/new-order-form"

import { useOrderValue } from "@/hooks/use-order-value"
import { useSavings } from "@/hooks/use-savings-query"
import { PROTOCOL_FEE, RELAYER_FEE } from "@/lib/constants/protocol"
import { usePrice } from "@/stores/price-store"

export function usePredictedFees({
  amount,
  base,
  isSell,
  isUSDCDenominated,
}: NewOrderFormProps) {
  const [debouncedAmount] = useDebounceValue(amount, 500)
  const baseToken = Token.findByTicker(base)
  const price = usePrice({
    baseAddress: baseToken.address,
  })

  const orderValue = useOrderValue({
    amount,
    base,
    isSell,
    isUSDCDenominated,
  })

  // TODO: [PERFORMANCE] baseAmount triggers render each time price changes, should debounce price s.t. it changes every 10s
  const baseAmount = React.useMemo(() => {
    if (!price) return 0
    if (isUSDCDenominated) {
      return debouncedAmount / price
    }
    return debouncedAmount
  }, [debouncedAmount, isUSDCDenominated, price])

  const feesCalculation = React.useMemo(() => {
    let res = {
      relayerFee: 0,
      protocolFee: 0,
    }
    if (!orderValue) return res
    res.protocolFee = orderValue * PROTOCOL_FEE
    res.relayerFee = orderValue * RELAYER_FEE
    return res
  }, [orderValue])

  const { data, isSuccess } = useSavings({
    amount: baseAmount,
    base,
    isSell,
    isUSDCDenominated,
  })
  const [predictedSavings, setPredictedSavings] = React.useState(0)
  React.useEffect(() => {
    setPredictedSavings(prev => {
      if (isSuccess && prev !== data.savings) {
        return data.savings
      } else if (!amount) {
        return 0
      }
      return prev
    })
  }, [amount, data?.savings, isSuccess])

  return {
    ...feesCalculation,
    predictedSavings,
  }
}
