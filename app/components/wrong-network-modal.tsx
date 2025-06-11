"use client"

import { ChainId } from "@lifi/sdk"
import { useIsMutating } from "@tanstack/react-query"
import {
  arbitrum,
  arbitrumSepolia,
  base,
  baseSepolia,
  mainnet,
} from "viem/chains"
import { extractChain } from "viem/utils"
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
  const { disconnect } = useDisconnect()
  const { switchChain } = useSwitchChain()
  const isMutatingChain = !!useIsMutating({ mutationKey: ["switchChain"] })
  const wagmiChainId = useChainId()

  const currentChainId = useCurrentChain()
  const currentChainName = useChainName(true /** short */)
  const isSignedIn = useIsWalletConnected()
  const setChainId = useServerStore((state) => state.setChainId)
  const resetAllWallets = useServerStore((state) => state.resetAllWallets)

  const isWrongNetwork = wagmiChainId !== currentChainId

  const isSupportedChain = useIsSupportedChain(wagmiChainId)

  // If mainnet, assume we are bridging
  const isMainnet = wagmiChainId === mainnet.id

  // if true, either arbitrum or base on mainnet
  // if false, neither

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
            onClick={() => switchChain({ chainId: currentChainId })}
          >
            {currentChainName}
          </Button>
          <Button
            className="flex-1 items-center justify-center whitespace-normal text-pretty border-0 border-l border-t font-extended text-lg"
            size="xl"
            variant="outline"
            onClick={() => {
              setChainId(wagmiChainId as any) // Safe because we know wagmi is either Arbitrum or Base on the right env
            }}
          >
            {wagmiChainName}
          </Button>
        </DialogFooter>
      </>
    )
  }

  const unsupportedChainContent = (
    <>
      <DialogHeader>
        <DialogTitle>Wrong Network</DialogTitle>
        <DialogDescription>
          You are currently on the wrong network. Please switch to the correct
          network to continue.
        </DialogDescription>
      </DialogHeader>
      <Button onClick={() => switchChain({ chainId: currentChainId })}>
        Switch to {currentChainName}
      </Button>
      <Button
        onClick={() => {
          disconnect()
          resetAllWallets()
        }}
      >
        Disconnect
      </Button>
    </>
  )

  const open = isWrongNetwork && isSignedIn && !isMutatingChain && !isMainnet
  return (
    <Dialog
      modal
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
