"use client"

import {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
} from "react"

import { RustUtils, type Config } from "@renegade-fi/react"

import { useCurrentChain, useCurrentWallet } from "../state-provider/hooks"
import { getConfigFromChainId } from "./config"

const RenegadeConfigContext = createContext<Config | undefined | null>(null)

/**
 * Context provisioning config object derived from cached wallet.
 * Should be deprecated when we migrate off of the internal config.
 */
export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const [isWasmInitialized, setIsWasmInitialized] = useState(false)

  // useLayoutEffect here to initialize Rust utils before paint
  useLayoutEffect(() => {
    RustUtils().then(() => {
      console.log("Rust utils initialized")
      setIsWasmInitialized(true)
    })
  }, [])

  const chainId = useCurrentChain()
  const wallet = useCurrentWallet()

  const config = useMemo(() => {
    if (!wallet.seed || !wallet.id || !isWasmInitialized) return undefined
    const config = getConfigFromChainId(chainId)
    config.setState((s) => ({
      ...s,
      seed: wallet.seed,
      id: wallet.id,
    }))
    return config
  }, [chainId, isWasmInitialized, wallet.id, wallet.seed])

  return (
    <RenegadeConfigContext.Provider value={config}>
      {children}
    </RenegadeConfigContext.Provider>
  )
}

export function useConfig(): Config | undefined {
  const context = useContext(RenegadeConfigContext)
  if (context === null) {
    throw new Error("useConfig must be used within ConfigProvider")
  }
  return context
}
