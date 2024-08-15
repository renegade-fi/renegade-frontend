import React from "react"

import { Token } from "@renegade-fi/react"
import { formatUnits, parseUnits } from "viem/utils"

import { PRICE_DECIMALS } from "@/lib/constants/precision"
import { MIN_FILL_SIZE } from "@/lib/constants/protocol"
import { usePrice } from "@/stores/price-store"

type ReturnType<T extends boolean> = T extends true ? string : bigint

export function useUSDPrice<T extends boolean = true>(
  token: Token,
  amount: bigint,
  formatted: T = true as T,
): ReturnType<T> {
  const price = usePrice({ baseAddress: token.address })
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
  const priceBigInt = parseUnits(price.toString(), PRICE_DECIMALS)
  return (amount * priceBigInt) / BigInt(10 ** PRICE_DECIMALS)
}