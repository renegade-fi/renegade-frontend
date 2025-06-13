import { useQuery } from "@tanstack/react-query"

import type { NewOrderFormProps } from "@/app/trade/[base]/components/new-order/new-order-form"

import { savingsQueryOptions } from "@/hooks/savings/savingsQueryOptions"
import { PROTOCOL_FEE, RELAYER_FEE } from "@/lib/constants/protocol"

export function useSavings({
  amount,
  base,
  isSell,
  isQuoteCurrency,
}: NewOrderFormProps) {
  const opts = savingsQueryOptions({
    amount,
    baseMint: base,
    direction: isSell ? "sell" : "buy",
    quoteTicker: "USDC",
    isQuoteCurrency,
    renegadeFeeRate: PROTOCOL_FEE + RELAYER_FEE,
  })

  return {
    ...useQuery(opts),
    queryKey: opts.queryKey,
  }
}
