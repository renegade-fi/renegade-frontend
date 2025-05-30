"use client"

import React from "react"

import { EVM, createConfig as createLifiConfig } from "@lifi/sdk"
import { ROOT_KEY_MESSAGE_PREFIX } from "@renegade-fi/react/constants"
import { ConnectKitProvider } from "connectkit"
import { mainnet } from "viem/chains"
import {
  WagmiProvider as Provider,
  State,
  useAccount,
  useVerifyMessage,
} from "wagmi"

import { SignInDialog } from "@/components/dialogs/onboarding/sign-in-dialog"

import { sidebarEvents } from "@/lib/events"
import { QueryProvider } from "@/providers/query-provider"

import { useServerStore } from "../state-provider/server-store-provider"
import { getConfig } from "./config"
import { connectKitTheme } from "./theme"

createLifiConfig({
  integrator: "renegade.fi",
  providers: [EVM()],
  // We disable chain preloading and will update chain configuration in runtime
  preloadChains: false,
})

interface WagmiProviderProps {
  children: React.ReactNode
  initialState?: State
}

export function WagmiProvider({ children, initialState }: WagmiProviderProps) {
  const [config] = React.useState(() => getConfig())
  const [open, setOpen] = React.useState(false)

  return (
    <Provider
      reconnectOnMount
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
      </QueryProvider>
    </Provider>
  )
}

/**
 * Wagmi state is the source of truth for connected browser wallet data.
 * We derive Renegade wallet state from Wagmi state and cache what is needed (seed, chainId, id).
 * Cached state is used to connect to the Renegade relayer.
 *
 * Wagmi
 * - on connect, ignore. sign in logic will populate the cached state
 * - on disconnect, clear the cached state
 * - on account switch, clear the cached state
 * - on chain switch, clear the cached state (unless mainnet, in which case we are bridging)
 */
function SyncRenegadeWagmiState() {
  const resetWallet = useServerStore((state) => state.resetWallet)
  const signature = useServerStore((state) => state.wallet.seed)
  const account = useAccount()
  const isBridging = account.chainId === mainnet.id
  const message = `${ROOT_KEY_MESSAGE_PREFIX} ${account.chainId}`
  const address = account.address

  const { data: verified } = useVerifyMessage({
    address,
    message,
    signature,
    query: {
      // Ignore while bridging
      enabled: !isBridging,
    },
  })

  React.useEffect(() => {
    if (isBridging) return
    if (verified !== undefined && !verified) {
      // Verification failed, clear the cached state
      resetWallet()
    }
  }, [isBridging, resetWallet, verified])

  React.useEffect(() => {
    if (account.status === "disconnected") {
      // Wagmi state may change while page is not loaded
      // So, we check account status on mount
      resetWallet()
    }
  }, [account.status, resetWallet])

  return null
}
