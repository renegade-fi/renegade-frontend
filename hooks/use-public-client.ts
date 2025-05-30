import { useMemo } from "react"

import { createPublicClient, http } from "viem"

import { useChain } from "./use-chain"

export function usePublicClient() {
  const chain = useChain()
  return useMemo(() => {
    if (!chain) return null
    return createPublicClient({
      chain,
      transport: http(),
    })
  }, [chain])
}
