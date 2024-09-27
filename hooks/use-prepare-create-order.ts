"use client"

import React from "react"

import {
  Token,
  stringifyForWasm,
  useBackOfQueueWallet,
  useConfig,
} from "@renegade-fi/react"
import { MAX_ORDERS } from "@renegade-fi/react/constants"
import { toHex } from "viem"

import { safeParseUnits } from "@/lib/format"

export type UsePrepareCreateOrderParameters = {
  id?: string
  base: `0x${string}`
  quote: `0x${string}`
  side: "buy" | "sell"
  amount: string
  worstCasePrice: string
  minFillAmount: string
}

export type UsePrepareCreateOrderReturnType = {
  request: string
}

export function usePrepareCreateOrder(
  parameters: UsePrepareCreateOrderParameters,
) {
  const { id = "", base, quote, side, amount, worstCasePrice, minFillAmount } = parameters
  const config = useConfig()
  const { data: wallet, isSuccess } = useBackOfQueueWallet()
  const request = React.useMemo(() => {
    if (!config.state.seed) return Error("Seed is required")
    // TODO: Create error types for common errors in SDK
    if (!isSuccess) return Error("Failed to fetch wallet.")
    if (wallet.orders.filter((order) => order.amount).length >= MAX_ORDERS)
      return Error("Max orders reached.")
    if (!worstCasePrice) return Error("Worst case price is required")
    const parsedAmount = safeParseUnits(
      amount,
      Token.findByAddress(base).decimals,
    )
    if (parsedAmount instanceof Error) return Error("Failed to parse amount.")
    const parsedMinFillAmount = safeParseUnits(
      minFillAmount,
      Token.findByAddress(base).decimals,
    )
    if (parsedMinFillAmount instanceof Error) return Error("Failed to parse min fill amount.")
    if (parsedMinFillAmount > parsedAmount) return Error("Min fill amount must be less than or equal to amount.")
    return config.utils.new_order(
      config.state.seed,
      stringifyForWasm(wallet),
      id,
      base,
      quote,
      side,
      toHex(parsedAmount),
      worstCasePrice,
      toHex(parsedMinFillAmount),
    ) as string
  }, [config.state.seed, config.utils, isSuccess, wallet, worstCasePrice, amount, base, minFillAmount, id, quote, side])
  return { request }
}
