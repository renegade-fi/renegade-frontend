import { Token } from "@renegade-fi/token-nextjs"
import { AlertTriangle } from "lucide-react"

import { useIsMaxBalances } from "@/components/dialogs/transfer/use-is-max-balances"
import {
  ResponsiveTooltip,
  ResponsiveTooltipContent,
  ResponsiveTooltipTrigger,
} from "@/components/ui/responsive-tooltip"

import { useChainId } from "@/hooks/use-chain-id"
import { useMediaQuery } from "@/hooks/use-media-query"
import { MAX_BALANCES_PLACE_ORDER_TOOLTIP } from "@/lib/constants/tooltips"
import { resolveTickerOnChain } from "@/lib/token"
import { cn } from "@/lib/utils"

export function NoBalanceSlotWarning({
  className,
  ticker,
  isSell,
}: {
  className?: string
  ticker: string
  isSell?: boolean
}) {
  const chainId = useChainId()
  const receiveMint = isSell
    ? resolveTickerOnChain("USDC", chainId)?.address
    : resolveTickerOnChain(ticker, chainId)?.address
  const isMaxBalances = useIsMaxBalances(receiveMint)
  const isDesktop = useMediaQuery("(min-width: 1024px)")

  if (isMaxBalances) {
    return (
      <ResponsiveTooltip>
        <ResponsiveTooltipTrigger
          onClick={(e) => isDesktop && e.preventDefault()}
        >
          <div
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-md bg-[#2A1700] p-3 text-center",
              className,
            )}
          >
            <AlertTriangle className="h-4 w-4" />
            <span>No balance slot available</span>
          </div>
        </ResponsiveTooltipTrigger>
        <ResponsiveTooltipContent>
          {MAX_BALANCES_PLACE_ORDER_TOOLTIP}
        </ResponsiveTooltipContent>
      </ResponsiveTooltip>
    )
  }

  return null
}
