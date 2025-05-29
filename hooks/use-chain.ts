import { useConfig } from "@renegade-fi/react"
import { type Chain } from "viem"

import { extractSupportedChain } from "@/lib/viem"

/**
 * @returns The Viem `Chain` object of the chain the user signed in with.
 * This may be different from the chain the user's browser wallet is connected to.
 */
export function useChain(): Chain | undefined {
  const config = useConfig()
  if (!config?.state.chainId) return undefined
  return extractSupportedChain(config.state.chainId)
}
