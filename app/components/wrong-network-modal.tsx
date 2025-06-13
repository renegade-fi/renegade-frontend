"use client"

import { useIsMutating } from "@tanstack/react-query"
import { mainnet } from "viem/chains"
import { useChainId, useDisconnect, useSwitchChain } from "wagmi"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { useChainName } from "@/hooks/use-chain-name"
import { useIsSupportedChain } from "@/hooks/use-is-supported-chain"
import { extractSupportedChain } from "@/lib/viem"
import {
  useCurrentChain,
  useIsWalletConnected,
} from "@/providers/state-provider/hooks"
import { useServerStore } from "@/providers/state-provider/server-store-provider"

export function WrongNetworkModal() {
  const wagmiChainId = useChainId()
  const currentChainId = useCurrentChain()
  const currentChainName = useChainName(true /** short */)

  const { switchChain } = useSwitchChain()
  /** Switch the Wagmi chain to the cached chain */
  function handleSwitchToCurrentChain() {
    switchChain({ chainId: currentChainId })
  }

  // If the chain is supported, we allow the user to pick the chain they want to use
  const isSupportedChain = useIsSupportedChain(wagmiChainId)

  const setChainId = useServerStore((state) => state.setChainId)
  /**
   * Switch the cached chain to the Wagmi chain.
   * Casting to any is safe because this function is only called if `isSupportedChain` is true, meaning we know wagmiChainId is either Arbitrum or Base
   */
  function handleSwitchToWagmiChain() {
    setChainId(wagmiChainId as any)
  }

  /** Content for when the chain is supported */
  let supportedChainContent: React.ReactNode
  if (isSupportedChain) {
    const wagmiChainName =
      extractSupportedChain(wagmiChainId).name.split(" ")[0]
    supportedChainContent = (
      <>
        <DialogHeader className="space-y-4 px-6 pt-6">
          <DialogTitle className="font-extended">
            Chain Switch Detected
          </DialogTitle>
          <DialogDescription>
            Select the network you&apos;d like to use Renegade on.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-row sm:space-x-0">
          <Button
            className="flex-1 border-0 border-t font-extended text-lg"
            size="xl"
            variant="outline"
            onClick={handleSwitchToCurrentChain}
          >
            {currentChainName}
          </Button>
          <Button
            className="flex-1 items-center justify-center whitespace-normal text-pretty border-0 border-l border-t font-extended text-lg"
            size="xl"
            variant="outline"
            onClick={handleSwitchToWagmiChain}
          >
            {wagmiChainName}
          </Button>
        </DialogFooter>
      </>
    )
  }

  const { disconnect } = useDisconnect()
  const resetAllWallets = useServerStore((state) => state.resetAllWallets)
  /** Disconnect the wallet and clear the cached state */
  function handleDisconnect() {
    disconnect()
    resetAllWallets()
  }

  /** Content for when the chain is not supported */
  const unsupportedChainContent = (
    <>
      <DialogHeader>
        <DialogTitle>Wrong Network</DialogTitle>
        <DialogDescription>
          You are currently on the wrong network. Please switch to the correct
          network to continue.
        </DialogDescription>
      </DialogHeader>
      <Button onClick={handleSwitchToCurrentChain}>
        Switch to {currentChainName}
      </Button>
      <Button onClick={handleDisconnect}>Disconnect</Button>
    </>
  )

  // If mainnet, assume we are bridging
  const isMainnet = wagmiChainId === mainnet.id
  // If we are switching chains, we don't want to show the modal
  const isMutatingChain = !!useIsMutating({ mutationKey: ["switchChain"] })
  const isWrongNetwork = wagmiChainId !== currentChainId
  const isSignedIn = useIsWalletConnected()
  /** Open the modal if:
   * - We are signed in
   * - We are on the wrong network
   * - We are not on mainnet
   * - We are not switching chains
   */
  const open = isSignedIn && isWrongNetwork && !isMainnet && !isMutatingChain
  return (
    <Dialog
      modal // Prevents the dialog from being closed by clicking outside
      open={open}
    >
      <DialogContent
        hideCloseButton
        className="p-0"
      >
        {isSupportedChain ? supportedChainContent : unsupportedChainContent}
      </DialogContent>
    </Dialog>
  )
}
