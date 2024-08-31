import React from "react"

import { Token } from "@renegade-fi/react"
import { formatUnits } from "viem/utils"

import { usePriceQuery } from "@/hooks/use-price-query"
import { PRICE_DECIMALS } from "@/lib/constants/precision"
import { MIN_FILL_SIZE } from "@/lib/constants/protocol"
import { safeParseUnits } from "@/lib/format"

type ReturnType<T extends boolean> = T extends true ? string : bigint

export function useUSDPrice<T extends boolean = true>(
  token: Token,
  amount: bigint,
  formatted: T = true as T,
): ReturnType<T> {
  const { data: price } = usePriceQuery(token.address)
  return React.useMemo(() => {
    const result = amountTimesPrice(amount, price)

    if (result < MIN_FILL_SIZE) {
      return (
        formatted ? formatUnits(BigInt(0), token.decimals) : BigInt(0)
      ) as ReturnType<T>
    }

    return (
      formatted ? formatUnits(result, token.decimals) : result
    ) as ReturnType<T>
  }, [amount, price, token.decimals, formatted])
}

export function amountTimesPrice(amount: bigint, price: number) {
  const priceBigInt = safeParseUnits(price, PRICE_DECIMALS)
  if (priceBigInt instanceof Error) return BigInt(0)
  return (amount * priceBigInt) / BigInt(10 ** PRICE_DECIMALS)
}
