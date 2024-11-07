"use client"

import React from "react"

import { EVM, createConfig as createLifiConfig } from "@lifi/sdk"
import { useConfig } from "@renegade-fi/react"
import { disconnect } from "@renegade-fi/react/actions"
import { ROOT_KEY_MESSAGE_PREFIX } from "@renegade-fi/react/constants"
import { ConnectKitProvider, getDefaultConfig } from "connectkit"
import { arbitrum, arbitrumSepolia, mainnet } from "viem/chains"
import {
  WagmiProvider as Provider,
  cookieToInitialState,
  createConfig,
  createStorage,
  http,
  useAccount,
  useConnections,
  useDisconnect,
  useConfig as useWagmiConfig,
} from "wagmi"

import { SignInDialog } from "@/components/dialogs/onboarding/sign-in-dialog"

import { cookieStorage } from "@/lib/cookie"
import { getURL } from "@/lib/utils"
import { chain, viemClient } from "@/lib/viem"
import { QueryProvider } from "@/providers/query-provider"

export const config = createConfig(
  getDefaultConfig({
    // TODO: Ensure user never signs message for mainnet
    chains: [chain, mainnet],
    transports: {
      [chain.id]: http(),
      [mainnet.id]: http("/api/proxy/mainnet"),
    },
    ssr: true,
    storage: createStorage({
      storage: cookieStorage,
    }),

    walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,

    appName: "Renegade",
    appDescription: "On-chain dark pool",
    appUrl: "https://trade.renegade.fi",
    appIcon: `${getURL()}/glyph_light.svg`,
  }),
)

export const mainnetConfig = createConfig({
  chains: [mainnet],
  transports: {
    [mainnet.id]: http("/api/proxy/mainnet"),
  },
})

export const arbitrumConfig = createConfig({
  chains: [chain],
  transports: {
    [arbitrum.id]: http(),
    [arbitrumSepolia.id]: http(),
  },
})

createLifiConfig({
  integrator: "renegade.fi",
  providers: [EVM()],
  // We disable chain preloading and will update chain configuration in runtime
  preloadChains: false,
})

const connectKitTheme = {
  "--ck-body-background": "hsl(var(--background))",
  "--ck-border-radius": "0",
  "--ck-font-family": "var(--font-sans-extended)",
  "--ck-primary-button-background": "hsl(var(--background))",
  "--ck-primary-button-border-radius": "0",
  "--ck-body-color": "hsl(var(--foreground))",
  "--ck-body-color-muted": "hsl(var(--muted-foreground))",
  "--ck-body-color-muted-hover": "hsl(var(--foreground))",
  "--ck-qr-dot-color": "hsl(var(--chart-blue))",
  "--ck-secondary-button-background": "hsl(var(--background))",
  "--ck-qr-border-color": "hsl(var(--border))",
  "--ck-overlay-background": "rgba(0,0,0,.8)",
}

export function WagmiProvider({
  children,
  cookie,
}: {
  children: React.ReactNode
  cookie?: string
}) {
  const [open, setOpen] = React.useState(false)
  const initialState = cookieToInitialState(config, cookie)
  return (
    <Provider
      config={config}
      initialState={initialState}
    >
      <QueryProvider>
        <ConnectKitProvider
          customTheme={connectKitTheme}
          options={{
            hideQuestionMarkCTA: true,
            hideTooltips: true,
            enforceSupportedChains: true,
          }}
          theme="midnight"
          onConnect={() => setOpen(true)}
        >
          {children}
          <SyncRenegadeWagmiState />
          {/* TODO: Any issues with this? */}
          <SignInDialog
            open={open}
            onOpenChange={setOpen}
          />
        </ConnectKitProvider>
      </QueryProvider>
    </Provider>
  )
}

function SyncRenegadeWagmiState() {
  const config = useConfig()
  const wagmiConfig = useWagmiConfig()
  const { connector, chainId, isConnected } = useAccount()
  const connections = useConnections()
  const { disconnectAsync: disconnectWagmi } = useDisconnect()

  // Some wallets auto-connect to wagmi but don't support the required chain (Arbitrum).
  // This effect detects those cases and cleans up the invalid connection by:
  // 1. Checking if the wallet's provider is accessible
  // 2. Attempting to switch to Arbitrum if on wrong chain
  // 3. Disconnecting (or forcefully clearing state) if either step fails
  React.useEffect(() => {
    const checkConnections = async () => {
      if (!isConnected || !connector) return
      if (typeof connector.getProvider !== "function") {
        // May not be available on initial page load
        return
      }

      connector
        .getProvider()
        .then(() => {
          if (chainId !== chain.id) {
            return connector.switchChain?.({
              chainId: chain.id,
            })
          }
        })
        .catch(() => {
          return disconnectWagmi().catch(() => {
            wagmiConfig.setState((state) => ({
              ...state,
              connections: new Map(),
            }))
          })
        })
    }

    checkConnections()
  }, [chainId, connector, isConnected, wagmiConfig, disconnectWagmi])

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
          disconnectWagmi()
          disconnect(config)
        }
      })
      .catch(() => {
        disconnectWagmi()
        disconnect(config)
      })
  }, [config, config.state.seed, connections, disconnectWagmi])

  return null
}
