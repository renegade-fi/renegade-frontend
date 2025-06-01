import React from "react"

import { isSupportedChainId } from "@renegade-fi/react"
import { useAccount } from "wagmi"

import { getDefaultQuote } from "@/lib/token"

export function useResolvePair(base: `0x${string}`) {
  const account = useAccount()

  return React.useMemo(() => {
    const chainId = account.chainId

    // Ignore disconnected state or unsupported chains
    if (!chainId || !isSupportedChainId(chainId)) {
      const quoteToken = getDefaultQuote(base, "renegade")
      return {
        base,
        quote: quoteToken.address,
      }
    }

    const quoteToken = getDefaultQuote(base, "renegade")

    return {
      base,
      quote: quoteToken.address,
    }
  }, [account.chainId, base])
}
