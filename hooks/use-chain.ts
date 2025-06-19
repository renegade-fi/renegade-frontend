"use client"

import { extractSupportedChain } from "@/lib/viem"
import { useCurrentChain } from "@/providers/state-provider/hooks"

/**
 * @returns The Viem `Chain` object of the chain the user signed in with.
 * This may be different from the chain the user's browser wallet is connected to.
 */
export function useChain() {
  return extractSupportedChain(useCurrentChain())
}
