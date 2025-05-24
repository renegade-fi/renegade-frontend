import { createConfig, createStorage, getSDKConfig } from "@renegade-fi/react"

import { env } from "@/env/client"
import { cookieStorage } from "@/lib/cookie"
import { viemClient } from "@/lib/viem"

export const sdkConfig = getSDKConfig(env.NEXT_PUBLIC_CHAIN_ID)

export const config = createConfig({
  chainId: sdkConfig.id,
  darkPoolAddress: sdkConfig.darkpoolAddress,
  priceReporterUrl: sdkConfig.priceReporterUrl,
  relayerUrl: sdkConfig.relayerUrl,
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
  // @sehyunc TODO: remove public client from config instantiation
  viemClient: viemClient as any,
})
