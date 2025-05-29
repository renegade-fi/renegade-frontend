"use client"

import React, { useMemo } from "react"

import {
  cookieToInitialState,
  RenegadeProvider as Provider,
  useConfig,
} from "@renegade-fi/react"
import { disconnect } from "@renegade-fi/react/actions"
import { ROOT_KEY_MESSAGE_PREFIX } from "@renegade-fi/react/constants"
import { ConnectKitProvider } from "connectkit"
import { createPublicClient, http } from "viem"
import {
  useAccount,
  useChainId,
  useConnect,
  useConnections,
  useDisconnect,
  useReconnect,
} from "wagmi"

import { SignInDialog } from "@/components/dialogs/onboarding/sign-in-dialog"

import { env } from "@/env/client"
import { sidebarEvents } from "@/lib/events"
import { extractSupportedChain } from "@/lib/viem"

import { getConfigFromChainId } from "./config"

interface RenegadeProviderProps {
  children: React.ReactNode
  cookieString?: string
  chainId?: number
}

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

export function RenegadeProvider({
  children,
  cookieString,
  chainId: initialChainId,
}: RenegadeProviderProps) {
  const [open, setOpen] = React.useState(false)
  const chainId = useChainId() ?? initialChainId
  const config = useMemo(() => {
    if (chainId) {
      return getConfigFromChainId(chainId)
    }
    return undefined
  }, [chainId])
  const initialState = config
    ? cookieToInitialState(config, cookieString)
    : undefined

  return (
    <Provider
      reconnectOnMount
      config={config}
      initialState={initialState}
    >
      <ConnectKitProvider
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
      >
        {children}
        <SyncRenegadeWagmiState />
        <SignInDialog
          open={open}
          onOpenChange={setOpen}
        />
      </ConnectKitProvider>
    </Provider>
  )
}

function SyncRenegadeWagmiState() {
  const config = useConfig()
  const { connector, chainId, isDisconnected } = useAccount()
  const connections = useConnections()
  const { connect: connectWagmi } = useConnect()
  const { disconnectAsync: disconnectWagmi } = useDisconnect()
  const { reconnectAsync: reconnectWagmi } = useReconnect()

  // Handles the case where Renegade wallet is connected, but wagmi wallet is not
  // Required because effect below does not catch locked wallet case
  React.useEffect(() => {
    if (isDisconnected && config?.state.seed) {
      console.log("Wallet disconnected: wallet not connected and seed exists")
      console.log(
        `Wallet disconnected: found ${connections.length} connections. Attempting to reconnect.`,
      )
      reconnectWagmi().then((conns) => {
        if (conns.length === 0) {
          console.log("Wallet disconnected: failed to reconnect")
          disconnect(config)
        } else {
          console.log("Wallet disconnected: successfully reconnected")
        }
      })
    }
  }, [config, connections.length, isDisconnected, reconnectWagmi])

  // When switching accounts in a wallet, we need to ensure the new account
  // is the one that originally generated the seed in storage. This effect:
  // 1. Verifies the current account can sign the stored seed
  // 2. Disconnects both wagmi and renegade if verification fails
  React.useEffect(() => {
    if (!connections.length || !config?.state.seed || !chainId) return

    const publicClient = createPublicClient({
      chain: extractSupportedChain(chainId),
      transport: http(env.NEXT_PUBLIC_RPC_URL),
    })

    publicClient
      .verifyMessage({
        address: connections[0].accounts[0],
        message: `${ROOT_KEY_MESSAGE_PREFIX} ${chainId}`,
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
  }, [chainId, config, connections, disconnectWagmi])

  return null
}
