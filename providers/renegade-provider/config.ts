import {
  createConfig,
  createStorage,
  getSDKConfig,
  isSupportedChainId,
} from "@renegade-fi/react"

import { cookieStorage } from "@/lib/cookie"

export const getConfigFromChainId = (chainId: number) => {
  if (!isSupportedChainId(chainId)) return undefined
  const sdkConfig = getSDKConfig(chainId)
  return createConfig({
    chainId,
    darkPoolAddress: sdkConfig.darkpoolAddress,
    priceReporterUrl: sdkConfig.priceReporterUrl,
    relayerUrl: sdkConfig.relayerUrl,
    ssr: true,
    storage: createStorage({
      storage: cookieStorage,
    }),
  })
}
