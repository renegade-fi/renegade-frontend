"use client"

import { useEffect, useState } from "react"

import { Config, useConfig } from "@renegade-fi/react"

/**
 * @returns The chain id of the chain the user signed in with.
 * This may be different from the chain the user's browser wallet is connected to.
 *
 * We subscribe to the state within config to ensure the value returned is reactive.
 */
export function useChainId(): number | undefined {
  const config = useConfig()
  const [chainId, setChainId] = useState<number | undefined>(
    config?.state.chainId,
  )

  useEffect(() => {
    if (!config) return
    const unsubscribe = watchChainId(config, {
      onChange: (chainId) => {
        setChainId(chainId)
      },
    })
    return () => unsubscribe()
  }, [config])

  return chainId
}

export type WatchChainIdParameters = {
  onChange(
    chainId: Config["state"]["chainId"],
    prevChainId: Config["state"]["chainId"],
  ): void
}

export type WatchChainIdReturnType = () => void

export function watchChainId(
  config: Config,
  parameters: WatchChainIdParameters,
): WatchChainIdReturnType {
  const { onChange } = parameters

  return config.subscribe((state) => state.chainId, onChange)
}
