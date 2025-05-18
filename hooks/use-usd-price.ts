import React from "react"

import { Token } from "@renegade-fi/token-nextjs"

import { usePriceQuery } from "@/hooks/use-price-query"
import { PRICE_DECIMALS } from "@/lib/constants/precision"
import { safeParseUnits } from "@/lib/format"

export function useUSDPrice(
  base: InstanceType<typeof Token>,
  amount: bigint, // amount in token decimals
) {
  const { data: price } = usePriceQuery(base.address)
  return React.useMemo(() => {
    const result = amountTimesPrice(amount, price)

    return result
  }, [amount, price])
}

export function amountTimesPrice(amount: bigint, price: number) {
  const priceBigInt = safeParseUnits(price, PRICE_DECIMALS)
  if (priceBigInt instanceof Error) return BigInt(0)
  return (amount * priceBigInt) / BigInt(10 ** PRICE_DECIMALS)
}
