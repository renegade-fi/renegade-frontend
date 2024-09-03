import React from "react"

import { Token } from "@renegade-fi/react"
import { formatUnits } from "viem/utils"

import { NewOrderFormProps } from "@/app/trade/[base]/components/new-order/new-order-form"

import { usePriceQuery } from "@/hooks/use-price-query"
import { amountTimesPrice } from "@/hooks/use-usd-price"
import { safeParseUnits } from "@/lib/format"

export function useOrderValue({
  amount,
  base,
  isUSDCDenominated,
}: NewOrderFormProps) {
  const baseToken = Token.findByTicker(base)
  const quoteToken = Token.findByTicker("USDC")
  const { data: usdPerBase } = usePriceQuery(baseToken.address)
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
      quoteToken.decimals,
    )
  }, [amount, basePerUsd, isUSDCDenominated, quoteToken.decimals])

  return {
    priceInUsd,
    priceInBase,
  }
}
