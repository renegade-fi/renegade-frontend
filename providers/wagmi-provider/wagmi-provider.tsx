"use client"

import React from "react"

import { EVM, createConfig as createLifiConfig } from "@lifi/sdk"
import { isSupportedChainId } from "@renegade-fi/react"
import { ChainId, ROOT_KEY_MESSAGE_PREFIX } from "@renegade-fi/react/constants"
import { ConnectKitProvider } from "connectkit"
import { mainnet } from "viem/chains"
import {
  WagmiProvider as Provider,
  State,
  useAccount,
  useVerifyMessage,
} from "wagmi"

import { resolveTickerParam } from "@/app/trade/[base]/utils"

import { SignInDialog } from "@/components/dialogs/onboarding/sign-in-dialog"

import { sidebarEvents } from "@/lib/events"
import { resolveAddress } from "@/lib/token"
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
          <SyncPairWithWagmi />
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

  const shouldClearWallet = React.useMemo(() => {
    // Clear if wagmi is disconnected
    if (account.status === "disconnected") {
      return true
    }

    // Clear if verification failed (but not while bridging)
    if (!isBridging && verified !== undefined && !verified) {
      return true
    }

    return false
  }, [account.status, isBridging, verified])

  React.useEffect(() => {
    if (shouldClearWallet) {
      resetWallet()
    }
  }, [shouldClearWallet, resetWallet])

  return null
}

/**
 * Sync cached base and quote mint with wagmi chain id
 */
function SyncPairWithWagmi() {
  const { baseMint, quoteMint } = useServerStore((state) => state.order)
  const setBase = useServerStore((state) => state.setBase)
  const setQuote = useServerStore((state) => state.setQuote)
  const account = useAccount()

  React.useEffect(() => {
    // Skip sync if on mainnet, no chainId, or unsupported chain
    if (
      account.chainId === mainnet.id ||
      !account.chainId ||
      !isSupportedChainId(account.chainId)
    ) {
      return
    }

    // Get resolved addresses for current chain
    const expectedBaseAddr = getResolvedAddrOnChain(baseMint, account.chainId)
    const expectedQuoteAddr = getResolvedAddrOnChain(quoteMint, account.chainId)

    // Update base if resolved address differs
    if (expectedBaseAddr && expectedBaseAddr !== baseMint) {
      setBase(expectedBaseAddr)
    }

    // Update quote if resolved address differs
    if (expectedQuoteAddr && expectedQuoteAddr !== quoteMint) {
      setQuote(expectedQuoteAddr)
    }
  }, [account.chainId, baseMint, quoteMint, setBase, setQuote])

  return null
}

/**
 * Resolves the address of a given mint on the specified chain by converting through ticker
 */
export function getResolvedAddrOnChain(
  mint: `0x${string}`,
  chainId: ChainId,
): `0x${string}` | null {
  const ticker = resolveAddress(mint).ticker
  const result = resolveTickerParam(ticker, chainId)

  return result && "resolved" in result ? result.resolved : null
}
