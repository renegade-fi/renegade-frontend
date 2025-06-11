"use client"

import Link from "next/link"

import { Token } from "@renegade-fi/token-nextjs"
import { useSwitchChain } from "wagmi"

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
import { useNeedsSwitch } from "@/hooks/use-needs-switch"
import { extractSupportedChain } from "@/lib/viem"
import { useServerStore } from "@/providers/state-provider/server-store-provider"

export function WrongPairNetworkModal() {
  const baseMint = useServerStore((s) => s.baseMint)
  const setChainId = useServerStore((s) => s.setChainId)
  const currentChainName = useChainName(true /** short */)
  const needsSwitch = useNeedsSwitch(baseMint)
  const { switchChain } = useSwitchChain()

  const token = Token.fromAddress(baseMint)
  const tokenChainId = token.chain

  if (!tokenChainId) return null
  const chain = extractSupportedChain(tokenChainId)
  const chainName = chain.name.split(" ")[0]

  const open = needsSwitch
  return (
    <Dialog
      modal
      open={open}
    >
      <DialogContent
        hideCloseButton
        className="p-0"
      >
        <DialogHeader className="space-y-4 px-6 pt-6">
          <DialogTitle className="font-extended">
            {token.ticker} trading not supported on {currentChainName}
          </DialogTitle>
          <DialogDescription>
            You are currently connected to {currentChainName}.<br />
            To trade {token.ticker}, switch to Arbitrum.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-row sm:space-x-0">
          <Button
            asChild
            className="flex-1 border-0 border-t font-extended text-lg"
            size="xl"
            variant="outline"
          >
            <Link href={`/trade/WETH`}>Back to {currentChainName}</Link>
          </Button>
          <Button
            className="flex-1 items-center justify-center whitespace-normal text-pretty border-0 border-l border-t font-extended text-lg"
            size="xl"
            variant="outline"
            onClick={() => {
              setChainId(tokenChainId)
              switchChain({ chainId: tokenChainId })
            }}
          >
            Switch to {chainName}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
