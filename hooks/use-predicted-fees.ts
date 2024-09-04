import React from "react"

import { NewOrderFormProps } from "@/app/trade/[base]/components/new-order/new-order-form"

import { useOrderValue } from "@/hooks/use-order-value"
import { useSavings } from "@/hooks/use-savings-query"
import { PROTOCOL_FEE, RELAYER_FEE } from "@/lib/constants/protocol"

// TODO: Refactor to rely solely on useOrderValue
export function usePredictedFees({
  amount,
  base,
  isSell,
  isUSDCDenominated,
}: NewOrderFormProps) {
  const { priceInBase, priceInUsd } = useOrderValue({
    amount,
    base,
    isSell,
    isUSDCDenominated,
  })

  const feesCalculation = React.useMemo(() => {
    let res = {
      relayerFee: 0,
      protocolFee: 0,
    }
    if (!priceInUsd) return res
    res.protocolFee = parseFloat(priceInUsd) * PROTOCOL_FEE
    res.relayerFee = parseFloat(priceInUsd) * RELAYER_FEE
    return res
  }, [priceInUsd])

  // Amount should always be base amount (even if denominated in USDC)
  const { data, isSuccess } = useSavings({
    amount: priceInBase,
    base,
    isSell,
    isUSDCDenominated,
  })
  const [predictedSavings, setPredictedSavings] = React.useState(0)
  React.useEffect(() => {
    setPredictedSavings((prev) => {
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
