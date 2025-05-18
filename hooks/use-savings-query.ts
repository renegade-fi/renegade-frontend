import { Token } from "@renegade-fi/token-nextjs"
import { useQuery } from "@tanstack/react-query"

import { NewOrderFormProps } from "@/app/trade/[base]/components/new-order/new-order-form"

import { PROTOCOL_FEE, RELAYER_FEE } from "@/lib/constants/protocol"

export function useSavings({ amount, base, isSell }: NewOrderFormProps) {
  const baseToken = Token.findByTicker(base)
  const options = {
    amount,
    baseTicker: baseToken.ticker,
    direction: isSell ? "sell" : "buy",
    quoteTicker: "USDC",
    renegadeFeeRate: PROTOCOL_FEE + RELAYER_FEE,
  }
  const queryKey = ["savings", options]
  return {
    ...useQuery({
      queryKey,
      queryFn: () =>
        fetch("/api/savings", {
          method: "POST",
          body: JSON.stringify(options),
        }).then((res) => res.json()),
      enabled: !!amount,
      staleTime: 0,
    }),
    queryKey,
  }
}
