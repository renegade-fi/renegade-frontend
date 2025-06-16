"use client"

import Image from "next/image"

import { isSupportedChainId } from "@renegade-fi/react"
import { useIsMutating } from "@tanstack/react-query"
import { mainnet } from "viem/chains"
import { useAccount, useConfig, useDisconnect, useSwitchChain } from "wagmi"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { useIsSupportedChain } from "@/hooks/use-is-supported-chain"
import { useCurrentChain } from "@/providers/state-provider/hooks"
import { useServerStore } from "@/providers/state-provider/server-store-provider"

export function WrongNetworkModal() {
  /** Content for when the chain is not supported */
  const { chains } = useConfig()
  const supportedChains = chains.filter((chain) => isSupportedChainId(chain.id))
  const { switchChain } = useSwitchChain()

  const { disconnect } = useDisconnect()
  const resetAllWallets = useServerStore((state) => state.resetAllWallets)
  /** Disconnect the wallet and clear the cached state */
  function handleDisconnect() {
    disconnect()
    resetAllWallets()
  }
  const unsupportedChainContent = (
    <>
      <DialogHeader className="space-y-4 px-6 pt-6">
        <DialogTitle className="font-extended">Wrong Network</DialogTitle>
        <DialogDescription className="text-pretty">
          Renegade does not support the currently connected network. <br />
          Switch or disconnect to continue.
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-4 px-6">
        {supportedChains.map((chain) => {
          return (
            <div
              key={chain.id}
              className="flex flex-col gap-2"
            >
              <Button
                variant="outline"
                onClick={() => switchChain({ chainId: chain.id })}
              >
                <Image
                  alt={chain.name}
                  height={16}
                  src={`/${chain.name.split(" ")[0].toLowerCase()}.svg`}
                  width={16}
                />
                <span className="ml-2">{chain.name}</span>
              </Button>
            </div>
          )
        })}
      </div>
      <DialogFooter className="flex-row sm:space-x-0">
        <Button
          autoFocus={false}
          className="flex-1 items-center justify-center whitespace-normal text-pretty border-0 border-l border-t font-extended text-lg"
          size="xl"
          variant="outline"
          onClick={handleDisconnect}
        >
          Disconnect
        </Button>
      </DialogFooter>
    </>
  )

  // If mainnet, assume we are bridging
  const { chain } = useAccount()
  const isMainnet = chain?.id === mainnet.id
  // If we are switching chains, we don't want to show the modal
  const isMutatingChain = !!useIsMutating({ mutationKey: ["switchChain"] })
  const currentChainId = useCurrentChain()
  const isWrongNetwork = chain?.id !== currentChainId
  const isSupportedChain = useIsSupportedChain(chain?.id)
  /** Open the modal if:
   * - We are on the wrong network
   * - We are not on mainnet
   * - We are not switching chains
   * - We are not on a supported chain (auto switch to supported chain)
   */
  const open =
    isWrongNetwork && !isMainnet && !isMutatingChain && !isSupportedChain
  return (
    <Dialog
      modal // Prevents the dialog from being closed by clicking outside
      open={open}
    >
      <DialogContent
        hideCloseButton
        className="p-0"
      >
        {unsupportedChainContent}
      </DialogContent>
    </Dialog>
  )
}
