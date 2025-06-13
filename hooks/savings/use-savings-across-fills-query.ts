import { OrderMetadata } from "@renegade-fi/react"
import { useQueries } from "@tanstack/react-query"
import { formatUnits } from "viem/utils"

import { savingsQueryOptions } from "@/hooks/savings/savingsQueryOptions"
import { PROTOCOL_FEE, RELAYER_FEE } from "@/lib/constants/protocol"
import { resolveAddress } from "@/lib/token"

export function useSavingsAcrossFillsQuery(order: OrderMetadata) {
  const isSell = order.data.side === "Sell"

  const queries = order.fills.map((fill) => {
    const baseToken = resolveAddress(order.data.base_mint)
    const amount = formatUnits(fill.amount, baseToken.decimals)
    return {
      ...savingsQueryOptions({
        amount,
        baseMint: order.data.base_mint,
        direction: isSell ? "sell" : "buy",
        quoteTicker: "USDC",
        isQuoteCurrency: false,
        renegadeFeeRate: PROTOCOL_FEE + RELAYER_FEE,
      }),
      staleTime: Infinity,
      gcTime: Infinity,
    }
  })

  return useQueries({
    queries,
    combine: (results) => {
      return results.reduce((acc, cur) => acc + (cur.data ?? 0), 0)
    },
  })
}
