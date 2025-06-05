import { useQuery } from "@tanstack/react-query"
import { base as baseChain, baseSepolia } from "viem/chains"

import { NewOrderFormProps } from "@/app/trade/[base]/components/new-order/new-order-form"

import { PROTOCOL_FEE, RELAYER_FEE } from "@/lib/constants/protocol"
import { resolveAddress } from "@/lib/token"

export function useSavings({ amount, base, isSell }: NewOrderFormProps) {
  const options = {
    amount,
    baseMint: base,
    direction: isSell ? "sell" : "buy",
    quoteTicker: "USDC",
    renegadeFeeRate: PROTOCOL_FEE + RELAYER_FEE,
  }
  const queryKey = ["savings", options]
  const baseToken = resolveAddress(base)
  const isBase = [baseChain.id, baseSepolia.id].includes(baseToken.chain as any)
  return {
    ...useQuery({
      queryKey,
      queryFn: () =>
        fetch("/api/savings", {
          method: "POST",
          body: JSON.stringify(options),
        }).then((res) => res.json()),
      enabled: !!amount && !isBase,
      staleTime: 0,
    }),
    queryKey,
  }
}
