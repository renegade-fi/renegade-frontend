import {
  createConfig,
  createStorage
} from "@renegade-fi/react"

import { cookieStorage } from "@/lib/cookie"
import { viemClient } from "@/lib/viem"

export const config = createConfig({
  darkPoolAddress: process.env.NEXT_PUBLIC_DARKPOOL_CONTRACT,
  priceReporterUrl: process.env.NEXT_PUBLIC_PRICE_REPORTER_URL,
  relayerUrl: process.env.NEXT_PUBLIC_RENEGADE_RELAYER_HOSTNAME,
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
  viemClient,
})
