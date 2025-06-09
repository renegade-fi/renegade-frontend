"use client"

import React from "react"

import { EVM, createConfig as createLifiConfig } from "@lifi/sdk"
import { ROOT_KEY_MESSAGE_PREFIX } from "@renegade-fi/react/constants"
import { ConnectKitProvider } from "connectkit"
import { verifyMessage } from "viem"
import { WagmiProvider as Provider, State, useAccount } from "wagmi"

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

  // Sync wallet state: clear cache when wagmi state invalidates it
  const account = useAccount()

  const wallets = useServerStore((state) => state.wallet)

  React.useEffect(() => {
    async function verifyWallets() {
      const address = account.address
      if (!address) return
      for (const [chainId, wallet] of wallets) {
        if (!wallet.seed) continue
        const message = `${ROOT_KEY_MESSAGE_PREFIX} ${chainId}`
        const signature = wallet.seed
        const valid = await verifyMessage({
          address,
          message,
          signature,
        })
        if (!valid) {
          resetWallet(chainId)
        }
      }
    }
    verifyWallets()
  }, [account.address, wallets, resetWallet])

  return null
}
