import { useMemo } from "react"

import { createConfig, getSDKConfig } from "@renegade-fi/react"

/** Constructs a config given chain id and seed. */
export function useLocalConfig(chainId?: number, seed?: `0x${string}`) {
  return useMemo(() => {
    if (!chainId) return
    const configv2 = getSDKConfig(chainId)
    const config = createConfig({
      darkPoolAddress: configv2.darkpoolAddress,
      priceReporterUrl: configv2.priceReporterUrl,
      relayerUrl: configv2.relayerUrl,
      chainId: configv2.id,
    })
    config.setState((s) => ({ ...s, seed, status: "in relayer" }))
    return config
  }, [chainId, seed])
}
