"use client"

import React from "react"

import { useConfig } from "@renegade-fi/react"
import { disconnect } from "@renegade-fi/react/actions"
import { ConnectKitProvider, getDefaultConfig } from "connectkit"
import {
  WagmiProvider as Provider,
  cookieToInitialState,
  createConfig,
  createStorage,
  http,
  useAccount,
  useAccountEffect,
} from "wagmi"

import { SignInDialog } from "@/components/dialogs/sign-in-dialog"

import { cookieStorage } from "@/lib/cookie"
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
    appIcon: "/glyph_dark.svg",
  }),
)

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
  const onOpenChange = () => setOpen(!open)
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
          onConnect={onOpenChange}
        >
          {children}
          <SyncRenegadeWagmiState />
        </ConnectKitProvider>
        <SignInDialog
          open={open}
          onOpenChange={onOpenChange}
        />
      </QueryProvider>
    </Provider>
  )
}

function SyncRenegadeWagmiState() {
  const config = useConfig()
  const { connector } = useAccount()

  React.useEffect(() => {
    if (!connector?.emitter) return
    const handleConnectorUpdate = (
      data: {
        accounts?: readonly `0x${string}`[] | undefined
        chainId?: number | undefined
      } & {
        uid: string
      },
    ) => {
      console.log("connector update", data)
      disconnect(config)
    }

    connector.emitter.on("change", handleConnectorUpdate)

    return () => {
      connector.emitter.off("change", handleConnectorUpdate)
    }
  }, [config, connector])

  useAccountEffect({
    // onConnect(data) {
    //   console.log("🚀 ~ onConnect ~ data:", data)
    //   console.log("disconnecting because onConnect")
    //   disconnect(config)
    // },
    onDisconnect() {
      console.log("disconnecting because onDisconnect")
      disconnect(config)
    },
  })
  return null
}
