"use client"

import React from "react"

import { env } from "@/env/client"
import {
  getDefaultQuote,
  resolveTicker,
  resolveTickerAndChain,
  zeroAddress,
} from "@/lib/token"
import { useCurrentChain } from "@/providers/state-provider/hooks"
import {
  MAINNET_CHAINS,
  TESTNET_CHAINS,
} from "@/providers/wagmi-provider/config"

export function useResolvePair(base: string) {
  const currentChain = useCurrentChain()

  return React.useMemo(() => {
    // If ticker exists on both chains, resolve to version on current chain
    const isMultiChain = isTickerMultiChain(base)
    if (isMultiChain) {
      const baseToken = resolveTickerAndChain(base, currentChain)
      if (!baseToken) {
        throw new Error(`Base token ${base} not found on chain ${currentChain}`)
      }
      const quoteToken = getDefaultQuote(baseToken.address, "renegade")
      return {
        base: baseToken.address,
        quote: quoteToken.address,
      }
    }

    // Otherwise, resolve to first match in token remaps
    const baseToken = resolveTicker(base)
    const quoteToken = getDefaultQuote(baseToken.address, "renegade")

    return {
      base: baseToken.address,
      quote: quoteToken.address,
    }
  }, [base, currentChain])
}

/** Returns true if the ticker exists on all chains, false otherwise */
function isTickerMultiChain(ticker: string) {
  const chains =
    env.NEXT_PUBLIC_CHAIN_ENVIRONMENT === "testnet"
      ? TESTNET_CHAINS
      : MAINNET_CHAINS
  for (const chain of chains) {
    const token = resolveTickerAndChain(ticker, chain.id)
    if (!token || token.address === zeroAddress) return false
  }
  return true
}
