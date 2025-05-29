"use client"

import { useMemo } from "react"

import { base, baseSepolia } from "viem/chains"

import { useChainId } from "./use-chain-id"

export function useIsBase() {
  const chainId = useChainId()
  return useMemo(() => {
    if (!chainId) return false
    return [baseSepolia.id, base.id].includes(chainId as any)
  }, [chainId])
}
