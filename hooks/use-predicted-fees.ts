import React from "react"

import { NewOrderFormProps } from "@/app/trade/[base]/components/new-order/new-order-form"

import { useSavings } from "@/hooks/savings/use-savings-query"
import { useOrderValue } from "@/hooks/use-order-value"
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
  const { data: savingsData, isSuccess } = useSavings(order)
  const [predictedSavings, setPredictedSavings] = React.useState(0)
  const [predictedSavingsBps, setPredictedSavingsBps] = React.useState(0)

  React.useEffect(() => {
    setPredictedSavings((prev) => {
      if (isSuccess && savingsData && prev !== savingsData.savings) {
        return savingsData.savings
      } else if (!order.amount) {
        return 0
      }
      return prev
    })

    setPredictedSavingsBps((prev) => {
      if (isSuccess && savingsData && prev !== savingsData.savingsBps) {
        return savingsData.savingsBps
      } else if (!order.amount) {
        return 0
      }
      return prev
    })
  }, [isSuccess, order.amount, savingsData])

  return {
    ...feesCalculation,
    predictedSavings,
    predictedSavingsBps,
  }
}
