"use client"

import { useMemo } from "react"

import { type Chain } from "viem"

import { extractSupportedChain } from "@/lib/viem"
import { useCurrentChain } from "@/providers/state-provider/hooks"

/**
 * @returns The Viem `Chain` object of the chain the user signed in with.
 * This may be different from the chain the user's browser wallet is connected to.
 */
export function useChain(): Chain | undefined {
  const chainId = useCurrentChain()
  return useMemo(() => {
    if (!chainId) return undefined
    return extractSupportedChain(chainId)
  }, [chainId])
}
