"use client"

import { useChain } from "./use-chain"

/**
 * @param short - If true, returns the short name of the chain.
 * @returns The name of the chain the user signed in with.
 */
export function useChainName(short = false): string | undefined {
  const chain = useChain()
  if (!chain) return undefined
  if (short) {
    return chain.name.split(" ")[0]
  }
  return chain.name
}
