"use client"

import React from "react"

import { EVM, createConfig as createLifiConfig } from "@lifi/sdk"
import { WagmiProvider as Provider, State } from "wagmi"

import { QueryProvider } from "@/providers/query-provider"

import { getConfig } from "./config"

createLifiConfig({
  integrator: "renegade.fi",
  providers: [EVM()],
  // We disable chain preloading and will update chain configuration in runtime
  preloadChains: false,
})

interface WagmiProviderProps {
  children: React.ReactNode
  initialState?: State
}

export function WagmiProvider({ children, initialState }: WagmiProviderProps) {
  const [config] = React.useState(() => getConfig())

  return (
    <Provider
      reconnectOnMount
      config={config}
      initialState={initialState}
    >
      <QueryProvider>{children}</QueryProvider>
    </Provider>
  )
}
