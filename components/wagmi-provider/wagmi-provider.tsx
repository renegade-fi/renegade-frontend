'use client'

import { SignInDialog } from '@/components/dialogs/sign-in-dialog'
import { QueryProvider } from '@/components/query-provider'
import { ConnectKitProvider } from 'connectkit'
import { useEffect, useState } from 'react'
import {
  WagmiProvider as Provider,
  State,
  useAccount,
  useAccountEffect,
} from 'wagmi'
import { config } from './config'
import { useConfig } from '@renegade-fi/react'
import { disconnect } from '@renegade-fi/react/actions'

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
          <SyncRenegadeWagmiState />
        </ConnectKitProvider>
        <SignInDialog open={open} onOpenChange={onOpenChange} />
      </QueryProvider>
    </Provider>
  )
}

function SyncRenegadeWagmiState() {
  const config = useConfig()
  const { address, connector } = useAccount()

  // Disconnect on wallet change
  useEffect(() => {
    const handleConnectorUpdate = (
      data: {
        accounts?: readonly `0x${string}`[] | undefined
        chainId?: number | undefined
      } & {
        uid: string
      },
    ) => {
      if (data.accounts) {
        disconnect(config)
      }
    }

    if (connector?.emitter) {
      connector.emitter.on('change', handleConnectorUpdate)
    }

    return () => {
      if (connector?.emitter) {
        connector?.emitter.off('change', handleConnectorUpdate)
      }
    }
  }, [config, connector])

  useAccountEffect({
    onDisconnect() {
      disconnect(config)
    },
  })

  useEffect(() => {
    if (!address) {
      disconnect(config)
    }
  }, [address, config])
  return <></>
}
