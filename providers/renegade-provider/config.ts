import { createConfig, createStorage, getSDKConfig } from "@renegade-fi/react"

import { cookieStorage } from "@/lib/cookie"
import { viemClient } from "@/lib/viem"

export const sdkConfig = getSDKConfig(Number(process.env.NEXT_PUBLIC_CHAIN_ID))

export const config = createConfig({
  chainId: sdkConfig.id,
  darkPoolAddress: sdkConfig.darkpoolAddress,
  priceReporterUrl: sdkConfig.priceReporterUrl,
  relayerUrl: sdkConfig.relayerUrl,
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
  viemClient,
})
