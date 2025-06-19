import { useQuery } from "@tanstack/react-query"
import { useDebounceValue } from "usehooks-ts"

import type { NewOrderFormProps } from "@/app/trade/[base]/components/new-order/new-order-form"

import { savingsQueryOptions } from "@/hooks/savings/savingsQueryOptions"
import { PROTOCOL_FEE, RELAYER_FEE } from "@/lib/constants/protocol"

export function useSavings({
  amount,
  base,
  isSell,
  isQuoteCurrency,
}: NewOrderFormProps) {
  const [debouncedAmount] = useDebounceValue(amount, 1000)

  const opts = savingsQueryOptions({
    amount: debouncedAmount,
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
