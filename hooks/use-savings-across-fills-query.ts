import { OrderMetadata } from "@renegade-fi/react"
import { formatUnits, Token } from "@renegade-fi/token-nextjs"
import { useQuery } from "@tanstack/react-query"

import { PROTOCOL_FEE, RELAYER_FEE } from "@/lib/constants/protocol"

export function useSavingsAcrossFillsQuery({
  order,
}: {
  order: OrderMetadata
}) {
  const baseToken = Token.findByAddress(order.data.base_mint)
  const quoteTicker = Token.findByAddress(order.data.quote_mint).ticker
  const direction = order.data.side === "Buy" ? "buy" : "sell"
  const options = order.fills.map((fill) => ({
    amount: formatUnits(fill.amount, baseToken.decimals),
    baseTicker: baseToken.ticker,
    quoteTicker,
    direction,
    renegadeFeeRate: PROTOCOL_FEE + RELAYER_FEE,
    timestamp: Number(fill.price.timestamp),
  }))
  const queryKey = ["savings-across-fills", order.id]
  return {
    ...useQuery({
      queryKey,
      queryFn: async () => {
        return Promise.all(
          options.map(async (option) => {
            return fetch("/api/savings", {
              method: "POST",
              body: JSON.stringify(option),
            })
              .then((res) => res.json())
              .then((data) => data.savings ?? 0)
          }),
        )
      },
      staleTime: Infinity,
      gcTime: Infinity,
    }),
    queryKey,
  }
}
