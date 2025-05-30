import React from "react"

import { NewOrderFormProps } from "@/app/trade/[base]/components/new-order/new-order-form"

import { useOrderValue } from "@/hooks/use-order-value"
import { useSavings } from "@/hooks/use-savings-query"
import { PROTOCOL_FEE, RELAYER_FEE } from "@/lib/constants/protocol"

export function usePredictedFees(order: NewOrderFormProps) {
  const { valueInBaseCurrency, valueInQuoteCurrency } = useOrderValue(order)

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
  const { data, isSuccess } = useSavings({
    amount: valueInBaseCurrency,
    base: order.base,
    isSell: order.isSell,
    isQuoteCurrency: order.isQuoteCurrency,
    baseMint: order.baseMint,
    quoteMint: order.quoteMint,
  })
  const [predictedSavings, setPredictedSavings] = React.useState(0)
  React.useEffect(() => {
    setPredictedSavings((prev) => {
      if (isSuccess && prev !== data.savings) {
        return data.savings
      } else if (!order.amount) {
        return 0
      }
      return prev
    })
  }, [order.amount, data?.savings, isSuccess])

  return {
    ...feesCalculation,
    predictedSavings,
  }
}
