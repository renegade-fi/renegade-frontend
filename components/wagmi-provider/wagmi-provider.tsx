'use client'

import { QueryProvider } from '@/components/query-provider'
import { ConnectKitProvider } from 'connectkit'
import { WagmiProvider as Provider, State } from 'wagmi'
import { config } from './config'

export function WagmiProvider({
  initialState,
  children,
}: {
  initialState?: State
  children: React.ReactNode
}) {
  return (
    <Provider config={config} initialState={initialState}>
      <QueryProvider>
        <ConnectKitProvider>{children}</ConnectKitProvider>
      </QueryProvider>
    </Provider>
  )
}
