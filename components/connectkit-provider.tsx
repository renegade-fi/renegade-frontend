'use client'

import { QueryClient } from '@tanstack/react-query'
import { getDefaultConfig, ConnectKitProvider as Provider } from 'connectkit'
import { createConfig, http } from 'wagmi'
import { arbitrumSepolia } from 'wagmi/chains'

const config = createConfig(
  getDefaultConfig({
    // Your dApps chains
    chains: [arbitrumSepolia],
    transports: {
      [arbitrumSepolia.id]: http(),
    },

    // Required API Keys
    walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,

    // Required App Info
    appName: 'Trade | Renegade',
  }),
)

const queryClient = new QueryClient()

export const ConnectKitProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  return <Provider>{children}</Provider>
}
