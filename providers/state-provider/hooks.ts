"use client"

import { ChainId } from "@renegade-fi/react/constants"

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
