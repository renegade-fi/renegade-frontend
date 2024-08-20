import React from "react"

import { Token } from "@renegade-fi/react"
import { formatUnits } from "viem/utils"

import { NewOrderFormProps } from "@/app/trade/[base]/components/new-order/new-order-form"

import { amountTimesPrice } from "@/hooks/use-usd-price"
import { safeParseUnits } from "@/lib/format"
import { usePrice } from "@/stores/price-store"

export function useOrderValue({
  amount,
  base,
  isUSDCDenominated,
}: NewOrderFormProps) {
  const baseToken = Token.findByTicker(base)
  const quoteToken = Token.findByTicker("USDC")
  const usdPerBase = usePrice({
    baseAddress: baseToken.address,
  })
  const basePerUsd = React.useMemo(() => {
    if (!usdPerBase) return ""
    return 1 / usdPerBase
  }, [usdPerBase])

  const priceInUsd = React.useMemo(() => {
    if (!usdPerBase) return ""
    if (isUSDCDenominated) {
      return amount
    }
    const parsedAmount = safeParseUnits(amount, baseToken.decimals)
    if (parsedAmount instanceof Error) {
      return ""
    }
    return formatUnits(
      amountTimesPrice(parsedAmount, usdPerBase),
      baseToken.decimals,
    )
  }, [amount, baseToken.decimals, isUSDCDenominated, usdPerBase])

  const priceInBase = React.useMemo(() => {
    if (!basePerUsd) return ""
    if (!isUSDCDenominated) {
      return amount
    }
    const parsedAmount = safeParseUnits(amount, quoteToken.decimals)
    if (parsedAmount instanceof Error) {
      return ""
    }
    return formatUnits(
      amountTimesPrice(parsedAmount, basePerUsd),
      baseToken.decimals,
    )
  }, [
    amount,
    basePerUsd,
    baseToken.decimals,
    isUSDCDenominated,
    quoteToken.decimals,
  ])

  return {
    priceInUsd,
    priceInBase,
  }
}
