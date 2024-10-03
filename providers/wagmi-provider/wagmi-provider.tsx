"use client"

import React from "react"

import {
  ChainType,
  EVM,
  createConfig as createLifiConfig,
  getChains,
} from "@lifi/sdk"
import { useConfig } from "@renegade-fi/react"
import { disconnect } from "@renegade-fi/react/actions"
import { ConnectKitProvider, getDefaultConfig } from "connectkit"
import {
  WagmiProvider as Provider,
  cookieToInitialState,
  createConfig,
  createStorage,
  http,
  useAccountEffect,
} from "wagmi"

import { SignInDialog } from "@/components/dialogs/sign-in-dialog"

import { cookieStorage } from "@/lib/cookie"
import { getURL } from "@/lib/utils"
import { chain } from "@/lib/viem"
import { QueryProvider } from "@/providers/query-provider"

export const config = createConfig(
  getDefaultConfig({
    chains: [chain],
    transports: {
      [chain.id]: http(),
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

createLifiConfig({
  integrator: "renegade",
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
        </ConnectKitProvider>
        <SignInDialog
          open={open}
          onOpenChange={setOpen}
        />
      </QueryProvider>
    </Provider>
  )
}

function SyncRenegadeWagmiState() {
  const config = useConfig()
  useAccountEffect({
    onDisconnect() {
      console.log("disconnecting because onDisconnect")
      disconnect(config)
    },
  })
  return null
}
