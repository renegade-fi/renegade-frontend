"use client"

import React, { useMemo } from "react"

import { RenegadeProvider as Provider } from "@renegade-fi/react"

import { useCurrentChain, useCurrentWallet } from "../state-provider/hooks"
import { getConfigFromChainId } from "./config"

interface RenegadeProviderProps {
  children: React.ReactNode
}

export function RenegadeProvider({ children }: RenegadeProviderProps) {
  const { seed, id } = useCurrentWallet()
  const chainId = useCurrentChain()
  const config = useMemo(() => {
    if (chainId && seed && id) {
      const config = getConfigFromChainId(chainId)
      config.setState((x) => ({
        ...x,
        seed,
        status: "in relayer",
        id,
        chainId,
      }))
      return config
    }
  }, [chainId, seed, id])

  return (
    <Provider
      config={config}
      reconnectOnMount={false}
    >
      {children}
    </Provider>
  )
}
