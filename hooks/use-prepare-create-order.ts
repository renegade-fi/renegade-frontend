"use client"

import {
  stringifyForWasm,
  useBackOfQueueWallet,
  useConfig,
} from "@renegade-fi/react"
import { MAX_ORDERS } from "@renegade-fi/react/constants"
import { Token } from "@renegade-fi/token-nextjs"
import { useQuery } from "@tanstack/react-query"
import { toHex } from "viem"

import { safeParseUnits } from "@/lib/format"

export type UsePrepareCreateOrderParameters = {
  id?: string
  base: `0x${string}`
  quote: `0x${string}`
  side: "buy" | "sell"
  amount: string
  worstCasePrice: string
  allowExternalMatches?: boolean
}

export function usePrepareCreateOrder(
  parameters: UsePrepareCreateOrderParameters,
) {
  const {
    id = "",
    base,
    quote,
    side,
    amount,
    worstCasePrice,
    allowExternalMatches = false,
  } = parameters
  const config = useConfig()
  const { data: wallet, isSuccess } = useBackOfQueueWallet()

  return useQuery({
    queryKey: ["prepare", "create-order", parameters],
    queryFn: async () => {
      if (!config.state.seed) throw new Error("Seed is required")
      if (!isSuccess) throw new Error("Failed to fetch wallet.")
      if (wallet.orders.filter((order) => order.amount).length >= MAX_ORDERS)
        throw new Error("Max orders reached.")
      if (!worstCasePrice) throw new Error("Worst case price is required")

      const parsedAmount = safeParseUnits(
        amount,
        Token.findByAddress(base).decimals,
      )
      if (parsedAmount instanceof Error)
        throw new Error("Failed to parse amount.")

      return config.utils.new_order(
        config.state.seed,
        stringifyForWasm(wallet),
        id,
        base,
        quote,
        side,
        toHex(parsedAmount),
        worstCasePrice,
        toHex(BigInt(0)),
        allowExternalMatches,
      )
    },
    enabled: isSuccess && Boolean(config.state.seed),
  })
}
