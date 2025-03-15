"use client"

import React from "react"

import { EVM, createConfig as createLifiConfig } from "@lifi/sdk"
import { useConfig } from "@renegade-fi/react"
import { disconnect } from "@renegade-fi/react/actions"
import { ROOT_KEY_MESSAGE_PREFIX } from "@renegade-fi/react/constants"
import { createAppKit } from "@reown/appkit/react"
import {
  WagmiProvider as Provider,
  cookieToInitialState,
  useAccount,
  useConnections,
  useDisconnect,
} from "wagmi"

import { SignInDialog } from "@/components/dialogs/onboarding/sign-in-dialog"

import { getURL } from "@/lib/utils"
import { chain, viemClient } from "@/lib/viem"
import { QueryProvider } from "@/providers/query-provider"

import { wagmiAdapter } from "./config"

createLifiConfig({
  integrator: "renegade.fi",
  providers: [EVM()],
  // We disable chain preloading and will update chain configuration in runtime
  preloadChains: false,
})

// Set up metadata
const metadata = {
  name: "Renegade",
  description: "On-chain dark pool",
  url: getURL(), // origin must match your domain & subdomain
  icons: [`${getURL()}/glyph_light.svg`],
}

// Create the modal
const modal = createAppKit({
  adapters: [wagmiAdapter],
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
  networks: [chain],
  defaultNetwork: chain,
  metadata: metadata,
  features: {
    analytics: true, // Optional - defaults to your Cloud configuration
  },
  excludeWalletIds: [
    "a797aa35c0fadbfc1a53e7f675162ed5226968b44a19ee3d24385c64d1d3c393",
  ],
})

interface WagmiProviderProps {
  children: React.ReactNode
  cookieString?: string
}

export function WagmiProvider({ children, cookieString }: WagmiProviderProps) {
  const [open, setOpen] = React.useState(false)
  const initialState = cookieToInitialState(
    wagmiAdapter.wagmiConfig,
    cookieString,
  )

  return (
    <Provider
      config={wagmiAdapter.wagmiConfig}
      initialState={initialState}
    >
      <QueryProvider>
        {/* <ConnectKitProvider
          customTheme={connectKitTheme}
          options={{
            hideQuestionMarkCTA: true,
            hideTooltips: true,
            enforceSupportedChains: true,
          }}
          theme="midnight"
          onConnect={() => {
            sidebarEvents.emit("open")
            setOpen(true)
          }}
        > */}
        {children}
        <SyncRenegadeWagmiState />
        <SignInDialog
          open={open}
          onOpenChange={setOpen}
        />
        {/* </ConnectKitProvider> */}
      </QueryProvider>
    </Provider>
  )
}

function SyncRenegadeWagmiState() {
  const config = useConfig()
  const { connector, chainId, isConnected } = useAccount()
  const connections = useConnections()
  const { disconnectAsync: disconnectWagmi } = useDisconnect()

  // Handles the case where Renegade wallet is connected, but wagmi wallet is not
  // Required because effect below does not catch locked wallet case
  React.useEffect(() => {
    if (!isConnected && config.state.seed) {
      console.log("Client disconnect reason: wallet not connected")
      disconnect(config)
    }
  }, [config, connector, isConnected])

  // When switching accounts in a wallet, we need to ensure the new account
  // is the one that originally generated the seed in storage. This effect:
  // 1. Verifies the current account can sign the stored seed
  // 2. Disconnects both wagmi and renegade if verification fails
  React.useEffect(() => {
    if (!connections.length || !config.state.seed) return

    viemClient
      .verifyMessage({
        address: connections[0].accounts[0],
        message: `${ROOT_KEY_MESSAGE_PREFIX} ${chain.id}`,
        signature: config.state.seed,
      })
      .then((verified) => {
        if (!verified) {
          console.log("Client disconnect reason: active account changed")
          // disconnectWagmi()
          disconnect(config)
        }
      })
      .catch(() => {
        console.log("Client disconnect reason: failed to verify signature")
        disconnectWagmi()
        disconnect(config)
      })
  }, [config, config.state.seed, connections, disconnectWagmi])

  return null
}
