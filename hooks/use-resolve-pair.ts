"use client"

import React from "react"

import { isSupportedChainId } from "@renegade-fi/react"
import { useAccount } from "wagmi"

import { env } from "@/env/client"
import {
  getDefaultQuote,
  resolveTicker,
  resolveTickerAndChain,
  zeroAddress,
} from "@/lib/token"
import {
  MAINNET_CHAINS,
  TESTNET_CHAINS,
} from "@/providers/wagmi-provider/config"

import { useChainId } from "./use-chain-id"

export function useResolvePair(base: string) {
  const account = useAccount()
  const renegadeChainId = useChainId()

  return React.useMemo(() => {
    const chainId = account.chainId

    // Ignore disconnected state or unsupported chains
    if (!chainId || !isSupportedChainId(chainId)) {
      const baseToken = resolveTicker(base)
      const quoteToken = getDefaultQuote(baseToken.address, "renegade")
      return {
        base: baseToken.address,
        quote: quoteToken.address,
      }
    }

    // If on renegade chain and ticker exists on both chains, resolve to version on renegade chain
    const isMultiChain = isTickerMultiChain(base)
    if (renegadeChainId && isMultiChain) {
      const baseToken = resolveTickerAndChain(base, renegadeChainId)
      if (!baseToken) {
        throw new Error(
          `Base token ${base} not found on chain ${renegadeChainId}`,
        )
      }
      const quoteToken = getDefaultQuote(baseToken.address, "renegade")
      return {
        base: baseToken.address,
        quote: quoteToken.address,
      }
    }

    // If only wagmi is connected, resolve to first match in token remaps
    const baseToken = resolveTicker(base)
    const quoteToken = getDefaultQuote(baseToken.address, "renegade")

    return {
      base: baseToken.address,
      quote: quoteToken.address,
    }
  }, [account.chainId, base, renegadeChainId])
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
