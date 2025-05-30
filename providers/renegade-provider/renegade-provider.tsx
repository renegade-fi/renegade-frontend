"use client"

import React, { useMemo } from "react"

import { RenegadeProvider as Provider } from "@renegade-fi/react"

import { useServerStore } from "../state-provider/server-store-provider"
import { getConfigFromChainId } from "./config"

interface RenegadeProviderProps {
  children: React.ReactNode
}

export function RenegadeProvider({ children }: RenegadeProviderProps) {
  const { seed, chainId, id } = useServerStore((state) => state.wallet)
  const config = useMemo(() => {
    if (chainId && seed && id) {
      const config = getConfigFromChainId(chainId)
      config.setState((x) => ({ ...x, seed, status: "in relayer", id }))
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
