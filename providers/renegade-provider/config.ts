import {
  createConfig,
  createStorage,
  getSDKConfig,
  isSupportedChainId,
} from "@renegade-fi/react"

import { env } from "@/env/client"
import { cookieStorage } from "@/lib/cookie"
import { viemClient } from "@/lib/viem"

export const sdkConfig = getSDKConfig(env.NEXT_PUBLIC_CHAIN_ID)

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
    viemClient: viemClient as any,
  })
}
