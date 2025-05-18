import { QuoteRequest, getQuote, getStatus } from "@lifi/sdk"
import { Token } from "@renegade-fi/token-nextjs"
import { useQuery } from "@tanstack/react-query"
import { useAccount } from "wagmi"

import { safeParseUnits } from "@/lib/format"

export interface UseSwapParams {
  fromMint: `0x${string}`
  toMint: `0x${string}`
  amount: string
  enabled?: boolean
}

export function useSwapQuote({
  fromMint,
  toMint,
  amount,
  enabled = true,
}: UseSwapParams) {
  const params = useParams({ fromMint, toMint, amount })
  const queryKey = ["swap", "quote", fromMint, toMint, amount]
  return {
    queryKey,
    ...useQuery({
      queryKey,
      queryFn: () => getQuote(params!),
      enabled: Boolean(enabled && params),
      refetchOnWindowFocus: false,
      staleTime: Infinity,
    }),
  }
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
    order: "RECOMMENDED",
    slippage: 0.005,
    allowExchanges: ["1inch", "0x"],
  }
}
