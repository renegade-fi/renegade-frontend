import { createConfig, getSDKConfig } from "@renegade-fi/react"
import { ChainId } from "@renegade-fi/react/constants"

export const getConfigFromChainId = (chainId: ChainId) => {
  const sdkConfig = getSDKConfig(chainId)
  return createConfig({
    chainId,
    darkPoolAddress: sdkConfig.darkpoolAddress,
    priceReporterUrl: sdkConfig.priceReporterUrl,
    relayerUrl: sdkConfig.relayerUrl,
  })
}
