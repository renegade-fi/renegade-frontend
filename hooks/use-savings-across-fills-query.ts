import { OrderMetadata, Token, formatAmount } from "@renegade-fi/react"
import { useQuery } from "@tanstack/react-query"

import {
  RENEGADE_PROTOCOL_FEE_RATE,
  RENEGADE_RELAYER_FEE_RATE,
} from "@/lib/constants/protocol"

export function useSavingsAcrossFillsQuery({
  order,
}: {
  order: OrderMetadata
}) {
  const baseToken = Token.findByAddress(order.data.base_mint)
  const quoteTicker = Token.findByAddress(order.data.quote_mint).ticker
  const direction = order.data.side === "Buy" ? "buy" : "sell"
  const options = order.fills.map(fill => ({
    amount: formatAmount(fill.amount, baseToken),
    baseTicker: baseToken.ticker,
    quoteTicker,
    direction,
    renegadeFeeRate: RENEGADE_PROTOCOL_FEE_RATE + RENEGADE_RELAYER_FEE_RATE,
    timestamp: Number(fill.price.timestamp),
  }))
  const queryKey = ["savings-across-fills", order.id]
  return {
    ...useQuery({
      queryKey,
      queryFn: async () => {
        return Promise.all(
          options.map(async option => {
            return fetch("/api/savings", {
              method: "POST",
              body: JSON.stringify(option),
            })
              .then(res => res.json())
              .then(data => data.savings ?? 0)
          }),
        )
      },
    }),
    queryKey,
  }
}
