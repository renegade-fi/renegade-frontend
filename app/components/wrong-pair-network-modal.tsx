"use client"

import Link from "next/link"

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
import { isTickerMultiChain, resolveTicker } from "@/lib/token"
import { extractSupportedChain } from "@/lib/viem"
import { useCurrentChain } from "@/providers/state-provider/hooks"
import { useServerStore } from "@/providers/state-provider/server-store-provider"

export function WrongPairNetworkModal({ base }: { base: string }) {
  const currentChainName = useChainName(true /** short */)
  const currentChain = useCurrentChain()
  const isMultiChain = isTickerMultiChain(base)
  const token = resolveTicker(base)
  const tokenChainId = token.chain
  if (!tokenChainId) throw new Error("unreachable") // Each token should have a chain
  const chain = extractSupportedChain(tokenChainId)
  const chainName = chain.name.split(" ")[0]

  const setChainId = useServerStore((s) => s.setChainId)
  const { switchChain } = useSwitchChain()
  /** Switch both cached chain and wagmi chain to the token chain */
  const handleSwitchToTokenChain = () => {
    setChainId(tokenChainId)
    switchChain({ chainId: tokenChainId })
  }

  // We need to switch if
  // - we are on the trade page
  // - the active pair's chain and the renegade wallet chain are not equal
  const open = !isMultiChain && currentChain !== tokenChainId
  return (
    <Dialog
      modal // Prevents the dialog from being closed by clicking outside
      open={open}
    >
      <DialogContent
        hideCloseButton
        className="p-0"
      >
        <DialogHeader className="space-y-4 px-6 pt-6">
          <DialogTitle className="font-extended">
            {token.ticker} not supported on {currentChainName}
          </DialogTitle>
          <DialogDescription>
            You are currently connected to {currentChainName}.<br />
            To trade {token.ticker}, switch to {chainName}.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-row sm:space-x-0">
          <Button
            asChild
            className="flex-1 border-0 border-t font-extended text-lg"
            size="xl"
            variant="outline"
          >
            <Link href={`/trade/WETH`}>Stay on {currentChainName}</Link>
          </Button>
          <Button
            className="flex-1 items-center justify-center whitespace-normal text-pretty border-0 border-l border-t font-extended text-lg"
            size="xl"
            variant="outline"
            onClick={handleSwitchToTokenChain}
          >
            Switch to {chainName}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
