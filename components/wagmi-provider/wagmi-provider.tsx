'use client'

import { useEffect, useState } from 'react'

import { useConfig } from '@renegade-fi/react'
import { disconnect } from '@renegade-fi/react/actions'
import { ConnectKitProvider } from 'connectkit'
import {
  WagmiProvider as Provider,
  State,
  useAccount,
  useAccountEffect,
} from 'wagmi'

import { SignInDialog } from '@/components/dialogs/sign-in-dialog'
import { QueryProvider } from '@/components/query-provider'

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
          <SyncRenegadeWagmiState />
        </ConnectKitProvider>
        <SignInDialog open={open} onOpenChange={onOpenChange} />
      </QueryProvider>
    </Provider>
  )
}

function SyncRenegadeWagmiState() {
  const config = useConfig()
  const { address, connector, status } = useAccount()

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
        console.log('disconnecting because connector update')
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
      console.log('disconnecting because onDisconnect')
      disconnect(config)
    },
  })

  useEffect(() => {
    if (!address) {
      console.log('disconnecting because address is undefined')
      disconnect(config)
    }
  }, [address, config])
  return null
}
