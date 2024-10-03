import {
  QuoteRequest,
  RoutesRequest,
  getQuote,
  getRoutes,
  getStepTransaction,
} from "@lifi/sdk"
import { Token } from "@renegade-fi/react"
import { useQuery } from "@tanstack/react-query"
import { useAccount } from "wagmi"

import { safeParseUnits } from "@/lib/format"

export interface UseSwapParams {
  fromMint: `0x${string}`
  toMint: `0x${string}`
  amount: string
}

export function useSwapRoutes({ fromMint, toMint, amount }: UseSwapParams) {
  const { address } = useAccount()

  const params = useParams({ fromMint, toMint, amount, address })

  const { data: steps } = useQuery({
    queryKey: ["swap", "routes", fromMint, toMint, amount, address],
    queryFn: () => getRoutes(params!),
    enabled: !!params,
    select: (data) => data.routes[0].steps,
  })
  console.log(`${steps?.length} steps`)

  const { data: transactionsRequests } = useQuery({
    queryKey: ["swap", "steps", ...(steps || [])],
    queryFn: () => {
      if (!steps) {
        return undefined
      }
      return Promise.all(
        steps.map((step) => {
          return getStepTransaction(step)
        }),
      )
    },
    enabled: !!steps?.length,
  })

  return { steps }
}

function useParams({
  fromMint,
  toMint,
  amount,
  address,
}: UseSwapParams & { address?: string }): RoutesRequest | undefined {
  if (!address || !Number(amount)) {
    return undefined
  }

  const token = Token.findByAddress(toMint)
  const parsedAmount = safeParseUnits(amount, token.decimals)

  if (parsedAmount instanceof Error) {
    return undefined
  }

  return {
    fromChainId: 42161,
    fromTokenAddress: fromMint,
    fromAddress: address,
    fromAmount: parsedAmount.toString(),
    toChainId: 42161,
    toTokenAddress: toMint,
    options: {
      order: "CHEAPEST",
      slippage: 0.005,
      exchanges: {
        allow: ["1inch", "0x"],
      },
    },
  }
}
