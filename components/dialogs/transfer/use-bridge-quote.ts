import { QuoteRequest, getQuote, getStatus } from "@lifi/sdk"
import { Token } from "@renegade-fi/token-nextjs"
import { useWallet as useSolanaWallet } from "@solana/wallet-adapter-react"
import { useQuery } from "@tanstack/react-query"
import { mainnet } from "viem/chains"
import { useAccount } from "wagmi"

import { safeParseUnits } from "@/lib/format"
import { chain, solana } from "@/lib/viem"

export interface UseBridgeParams {
  fromChain: number
  fromMint: string
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

export const allowBridges = ["across", "mayan"]

function useParams({
  fromMint,
  toMint,
  amount,
  fromChain,
  toChain,
}: UseBridgeParams): QuoteRequest | undefined {
  const { address } = useAccount()
  const { publicKey: solanaWallet } = useSolanaWallet()
  // @ts-ignore
  const fromAddress = [mainnet.id, chain.id].includes(fromChain)
    ? address
    : fromChain === solana.id
      ? solanaWallet?.toString()
      : undefined
  if (!fromAddress || !toMint || !Number(amount)) {
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
    fromAddress,
    fromAmount: parsedAmount.toString(),
    toAddress: address,
    toChain,
    toToken: toMint,
    order: "FASTEST",
    slippage: 0.005,
    allowBridges,
    allowExchanges: [],
  }
}
