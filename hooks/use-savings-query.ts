import { Token } from "@renegade-fi/react"
import { useQuery } from "@tanstack/react-query"

import { NewOrderFormProps } from "@/app/trade/[base]/components/new-order/new-order-form"

import {
  RENEGADE_PROTOCOL_FEE_RATE,
  RENEGADE_RELAYER_FEE_RATE,
} from "@/lib/constants/protocol"

export function useSavings({ amount, base, isSell }: NewOrderFormProps) {
  const baseToken = Token.findByTicker(base)
  const options = {
    amount,
    baseTicker: baseToken.ticker,
    direction: isSell ? "sell" : "buy",
    quoteTicker: "USDC",
    renegadeFeeRate: RENEGADE_PROTOCOL_FEE_RATE + RENEGADE_RELAYER_FEE_RATE,
  }
  const queryKey = ["savings", options]
  return {
    ...useQuery({
      queryKey,
      queryFn: () =>
        fetch("/api/savings", {
          method: "POST",
          body: JSON.stringify(options),
        }).then(res => res.json()),
      enabled: !!amount,
    }),
    queryKey,
  }
}
