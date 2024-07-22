import React from "react"

import { Token } from "@renegade-fi/react"

import { NewOrderFormProps } from "@/app/trade/[base]/components/new-order/new-order-form"

import { usePrice } from "@/stores/price-store"

export function useOrderValue({
  amount,
  base,
  isUSDCDenominated,
}: NewOrderFormProps) {
  const baseToken = Token.findByTicker(base)
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

  return usdPrice
}
