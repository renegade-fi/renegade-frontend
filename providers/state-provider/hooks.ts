"use client"

import { useMemo } from "react"

import { ChainId } from "@renegade-fi/react/constants"

import { getConfigFromChainId } from "../renegade-provider/config"
import { CachedWallet, createEmptyWallet } from "./schema"
import { useServerStore } from "./server-store-provider"

/**
 * Returns the active chain ID from server state.
 */
export function useCurrentChain(): ChainId {
  return useServerStore((s) => s.chainId)
}

/**
 * Returns the wallet entry (seed & id) for the active chain.
 */
export function useCurrentWallet(): CachedWallet {
  const chain = useCurrentChain()
  return useServerStore((s) => {
    const wallet = s.wallet.get(chain)
    if (!wallet) return createEmptyWallet()
    return wallet
  })
}

/**
 * Returns true if both seed and id are present for the active chain.
 */
export function useIsWalletConnected(): boolean {
  const { seed, id } = useCurrentWallet()
  return Boolean(seed && id)
}

/**
 * Returns a config object with the current wallet and chain id.
 * Importantly, this reacts to changes in the wallet and chain id.
 */
export function useConfig() {
  const chainId = useCurrentChain()
  const wallet = useCurrentWallet()

  return useMemo(() => {
    if (!wallet.seed || !wallet.id) return
    const config = getConfigFromChainId(chainId)
    config.setState((s) => ({
      ...s,
      seed: wallet.seed,
      id: wallet.id,
      chainId,
      status: "in relayer",
    }))
    return config
  }, [chainId, wallet.id, wallet.seed])
}
