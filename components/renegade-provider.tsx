'use client'

import { viemClient } from '@/lib/viem'
import { RenegadeProvider as Provider, createConfig } from '@renegade-fi/react'

export const config = createConfig({
  darkPoolAddress: process.env.NEXT_PUBLIC_DARKPOOL_CONTRACT,
  priceReporterUrl: process.env.NEXT_PUBLIC_PRICE_REPORTER_URL,
  relayerUrl: process.env.NEXT_PUBLIC_RENEGADE_RELAYER_HOSTNAME,
  ssr: true,
  viemClient,
})

export function RenegadeProvider({ children }: { children: React.ReactNode }) {
  return <Provider config={config}>{children}</Provider>
}
