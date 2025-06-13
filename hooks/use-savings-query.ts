import { useQuery } from "@tanstack/react-query"

import { NewOrderFormProps } from "@/app/trade/[base]/components/new-order/new-order-form"

import { PROTOCOL_FEE, RELAYER_FEE } from "@/lib/constants/protocol"

export function useSavings({
  amount, // either in base currency or quote currency
  base,
  isSell,
  isQuoteCurrency,
}: NewOrderFormProps) {
  const options = {
    amount,
    baseMint: base,
    direction: isSell ? "sell" : "buy",
    quoteTicker: "USDC",
    isQuoteCurrency,
    renegadeFeeRate: PROTOCOL_FEE + RELAYER_FEE,
  }
  const queryKey = ["savings", options]

  async function queryFn() {
    const response = await fetch("/api/savings", {
      method: "POST",
      body: JSON.stringify(options),
    })
    if (!response.ok) {
      throw new Error(response.statusText)
    }
    const data = await response.json()
    return data.savings
  }

  const enabled = !!Number.parseFloat(amount)

  return {
    ...useQuery<number>({
      queryKey,
      queryFn,
      retry: 3,
      staleTime: 0,
      enabled,
    }),
    queryKey,
  }
}
