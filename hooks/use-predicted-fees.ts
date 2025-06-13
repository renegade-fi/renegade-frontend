import React from "react"

import { NewOrderFormProps } from "@/app/trade/[base]/components/new-order/new-order-form"

import { useOrderValue } from "@/hooks/use-order-value"
import { useSavings } from "@/hooks/use-savings-query"
import { PROTOCOL_FEE, RELAYER_FEE } from "@/lib/constants/protocol"

export function usePredictedFees(order: NewOrderFormProps) {
  const { valueInQuoteCurrency } = useOrderValue(order)

  const feesCalculation = React.useMemo(() => {
    let res = {
      relayerFee: 0,
      protocolFee: 0,
    }
    if (!valueInQuoteCurrency) return res
    res.protocolFee = parseFloat(valueInQuoteCurrency) * PROTOCOL_FEE
    res.relayerFee = parseFloat(valueInQuoteCurrency) * RELAYER_FEE
    return res
  }, [valueInQuoteCurrency])

  // Amount should always be base amount (even if denominated in USDC)
  const { data: savings, isSuccess } = useSavings(order)
  const [predictedSavings, setPredictedSavings] = React.useState(0)
  React.useEffect(() => {
    setPredictedSavings((prev) => {
      if (isSuccess && prev !== savings) {
        return savings
      } else if (!order.amount) {
        return 0
      }
      return prev
    })
  }, [isSuccess, order.amount, savings])

  return {
    ...feesCalculation,
    predictedSavings,
  }
}
