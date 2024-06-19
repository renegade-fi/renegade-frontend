'use client'

import { SignInDialog } from '@/components/dialogs/sign-in-dialog'
import { QueryProvider } from '@/components/query-provider'
import { ConnectKitProvider } from 'connectkit'
import { useState } from 'react'
import { WagmiProvider as Provider, State } from 'wagmi'
import { config } from './config'

export function WagmiProvider({
  initialState,
  children,
}: {
  initialState?: State
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const onOpenChange = () => setOpen(!open)
  return (
    <Provider config={config} initialState={initialState}>
      <QueryProvider>
        <ConnectKitProvider onConnect={onOpenChange}>
          {children}
        </ConnectKitProvider>
        <SignInDialog open={open} onOpenChange={onOpenChange} />
      </QueryProvider>
    </Provider>
  )
}
