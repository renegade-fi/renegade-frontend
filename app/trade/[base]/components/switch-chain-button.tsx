import { useMemo } from "react"

import { Token } from "@renegade-fi/token-nextjs"
import { useSwitchChain } from "wagmi"
import { arbitrum, arbitrumSepolia, base, baseSepolia } from "wagmi/chains"

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { useChainId } from "@/hooks/use-chain-id"
import { useIsBase } from "@/hooks/use-is-base"
import { cn } from "@/lib/utils"
import { isTestnet } from "@/lib/viem"

export function SwitchChainButton({
  className,
  baseMint,
}: {
  className?: string
  baseMint: `0x${string}`
}) {
  const { switchChain } = useSwitchChain()
  const chainId = useChainId()
  const isBase = useIsBase()

  const targetChain = useMemo(() => {
    if (!chainId) return null
    if (isBase) {
      return isTestnet ? arbitrumSepolia : arbitrum
    }
    return isTestnet ? baseSepolia : base
  }, [chainId, isBase])

  const baseTicker = useMemo(() => {
    if (!targetChain) return null
    try {
      return Token.fromAddressOnChain(baseMint, targetChain.id).ticker
    } catch {
      return null
    }
  }, [baseMint, targetChain])

  if (!targetChain || !baseTicker) {
    return (
      <Button
        className={cn(className)}
        size="xl"
        type="button"
        onClick={(e) => {
          e.preventDefault()
          if (targetChain) {
            switchChain({ chainId: targetChain.id })
          }
        }}
      >
        Switch Chain to {isBase ? "Arbitrum" : "Base"}
      </Button>
    )
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            className={cn(className)}
            size="xl"
            type="button"
            onClick={(e) => {
              e.preventDefault()
              if (targetChain) {
                switchChain({ chainId: targetChain.id })
              }
            }}
          >
            Switch Chain to {isBase ? "Arbitrum" : "Base"}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {baseTicker} is only available on {targetChain.name}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
