import { QuoteRequest, getQuote, getStatus } from "@lifi/sdk"
import { Token } from "@renegade-fi/react"
import { useQuery } from "@tanstack/react-query"
import { useAccount } from "wagmi"

import { safeParseUnits } from "@/lib/format"

export interface UseBridgeParams {
  fromChain: number
  fromMint: `0x${string}`
  toChain: number
  toMint: `0x${string}`
  amount: string
  enabled?: boolean
}

export function useBridgeQuote({
  fromMint,
  toMint,
  amount,
  enabled = true,
  fromChain,
  toChain,
}: UseBridgeParams) {
  const params = useParams({ fromMint, toMint, amount, fromChain, toChain })
  const queryKey = [
    "bridge",
    "quote",
    fromChain,
    toChain,
    fromMint,
    toMint,
    amount,
  ]
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
  fromChain,
  toChain,
}: UseBridgeParams): QuoteRequest | undefined {
  const { address } = useAccount()
  if (!address || !toMint || !Number(amount)) {
    return undefined
  }

  const token = Token.findByAddress(toMint)
  const parsedAmount = safeParseUnits(amount, token.decimals)

  if (parsedAmount instanceof Error) {
    return undefined
  }
  return {
    fromChain,
    fromToken: fromMint,
    fromAddress: address,
    fromAmount: parsedAmount.toString(),
    toChain,
    toToken: toMint,
    order: "FASTEST",
    slippage: 0.005,
    allowBridges: ["across"],
    allowExchanges: [],
  }
}
