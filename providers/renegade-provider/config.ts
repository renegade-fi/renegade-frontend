import { createConfig, getSDKConfig } from "@renegade-fi/react"
import { ChainId } from "@renegade-fi/react/constants"

import { WalletData } from "@/hooks/query/utils"

export const getConfigFromChainId = (chainId: ChainId) => {
  const sdkConfig = getSDKConfig(chainId)
  return createConfig({
    chainId,
    darkPoolAddress: sdkConfig.darkpoolAddress,
    priceReporterUrl: sdkConfig.priceReporterUrl,
    relayerUrl: sdkConfig.relayerUrl,
  })
}

export function getConfig({ seed, chainId, id }: WalletData) {
  if (!chainId) throw new Error("Chain ID is required")
  if (!seed) throw new Error("Seed is required")
  if (!id) throw new Error("ID is required")
  const configv2 = getSDKConfig(chainId)
  const config = createConfig({
    darkPoolAddress: configv2.darkpoolAddress,
    priceReporterUrl: configv2.priceReporterUrl,
    relayerUrl: configv2.relayerUrl,
    chainId: configv2.id,
  })
  config.setState((s) => ({ ...s, seed, status: "in relayer", id, chainId }))
  return config
}
