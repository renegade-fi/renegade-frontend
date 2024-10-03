import { QuoteRequest, getQuote } from "@lifi/sdk"
import { Token } from "@renegade-fi/react"
import { useQuery } from "@tanstack/react-query"
import { useAccount } from "wagmi"

import { safeParseUnits } from "@/lib/format"

export interface UseSwapParams {
  fromMint: `0x${string}`
  toMint: `0x${string}`
  amount: string
}

export function useSwapQuote({ fromMint, toMint, amount }: UseSwapParams) {
  const params = useParams({ fromMint, toMint, amount })
  const { data: quote } = useQuery({
    queryKey: ["swap", "quote", fromMint, toMint, amount],
    queryFn: () => getQuote(params!),
    enabled: !!params,
  })
  return quote
}

function useParams({
  fromMint,
  toMint,
  amount,
}: UseSwapParams & { address?: string }): QuoteRequest | undefined {
  const { address } = useAccount()
  if (!address || !Number(amount)) {
    return undefined
  }

  const token = Token.findByAddress(toMint)
  const parsedAmount = safeParseUnits(amount, token.decimals)

  if (parsedAmount instanceof Error) {
    return undefined
  }

  return {
    fromChain: 42161,
    fromToken: fromMint,
    fromAddress: address,
    fromAmount: parsedAmount.toString(),
    toChain: 42161,
    toToken: toMint,
    order: "CHEAPEST",
    slippage: 0.005,
    allowExchanges: ["1inch", "0x"],
  }
}
