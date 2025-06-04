import { OrderMetadata } from "@renegade-fi/react"
import { formatUnits } from "@renegade-fi/token-nextjs"
import { useQuery } from "@tanstack/react-query"
import { base, baseSepolia } from "viem/chains"

import { PROTOCOL_FEE, RELAYER_FEE } from "@/lib/constants/protocol"
import { resolveAddress } from "@/lib/token"

export function useSavingsAcrossFillsQuery({
  order,
}: {
  order: OrderMetadata
}) {
  const baseToken = resolveAddress(order.data.base_mint)
  const quoteTicker = resolveAddress(order.data.quote_mint).ticker
  const direction = order.data.side === "Buy" ? "buy" : "sell"
  const options = order.fills.map((fill) => ({
    amount: formatUnits(fill.amount, baseToken.decimals),
    baseMint: order.data.base_mint,
    quoteTicker,
    direction,
    renegadeFeeRate: PROTOCOL_FEE + RELAYER_FEE,
    timestamp: Number(fill.price.timestamp),
  }))
  const queryKey = ["savings-across-fills", order.id]
  const isBase = [base.id, baseSepolia.id].includes(baseToken.chain as any)
  console.log("isBase debug", {
    isBase,
    baseToken,
    address: baseToken.address,
    chain: baseToken.chain,
  })
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
      enabled: !isBase,
    }),
    queryKey,
  }
}
