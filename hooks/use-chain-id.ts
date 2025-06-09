"use client"

import { ChainId } from "@renegade-fi/react/constants"

import { useCurrentChain } from "@/providers/state-provider/hooks"

/**
 * @returns The chain id of the chain the user signed in with.
 * This may be different from the chain the user's browser wallet is connected to.
 *
 * We subscribe to the state within config to ensure the value returned is reactive.
 */
export function useChainId(): ChainId | undefined {
  return useCurrentChain()
}
