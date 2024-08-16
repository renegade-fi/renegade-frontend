"use client"

import React from "react"

import { safeParseUnits } from "@/lib/format"
import {
  Token,
  stringifyForWasm,
  useBackOfQueueWallet,
  useConfig,
} from "@renegade-fi/react"
import { MAX_ORDERS } from "@renegade-fi/react/constants"
import { toHex } from "viem"

export type UsePrepareCreateOrderParameters = {
  id?: string
  base: `0x${string}`
  quote: `0x${string}`
  side: 'buy' | 'sell'
  amount: number
}


export type UsePrepareCreateOrderReturnType = {
  request: string
}

export function usePrepareCreateOrder(
  parameters: UsePrepareCreateOrderParameters,
) {
  const { id = "", base, quote, side, amount } = parameters
  const config = useConfig()
  const { data: wallet, isSuccess } = useBackOfQueueWallet()
  const request = React.useMemo(() => {
    // TODO: Create error types for common errors in SDK
    if (!isSuccess) return Error("Failed to fetch wallet.")
    if (wallet.orders.filter((order) => order.amount).length >= MAX_ORDERS)
      return Error("Max orders reached.")
    const parsedAmount = safeParseUnits(amount, Token.findByAddress(base).decimals)
    if (parsedAmount instanceof Error) return Error("Failed to parse amount.")
    return config.utils.new_order(
      stringifyForWasm(wallet),
      id,
      base,
      quote,
      side,
      toHex(parsedAmount),
    ) as string
  }, [config, wallet, id, base, quote, side, amount, isSuccess])
  return { request }
}
