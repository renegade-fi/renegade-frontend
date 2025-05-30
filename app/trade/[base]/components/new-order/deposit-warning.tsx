import { useBackOfQueueWallet } from "@renegade-fi/react"
import { Token } from "@renegade-fi/token-nextjs"
import { AlertTriangle } from "lucide-react"

import {
  ResponsiveTooltip,
  ResponsiveTooltipContent,
  ResponsiveTooltipTrigger,
} from "@/components/ui/responsive-tooltip"

import { useChainId } from "@/hooks/use-chain-id"
import { useMediaQuery } from "@/hooks/use-media-query"
import { ORDER_FORM_DEPOSIT_WARNING } from "@/lib/constants/tooltips"
import { resolveTickerOnChain } from "@/lib/token"
import { cn } from "@/lib/utils"

export function DepositWarning({
  className,
  ticker,
}: {
  className?: string
  ticker: string
}) {
  const isDesktop = useMediaQuery("(min-width: 1024px)")
  const chainId = useChainId()
  const { data: hasBalances } = useBackOfQueueWallet({
    query: {
      select: (data) => {
        const baseToken = resolveTickerOnChain(ticker, chainId)
        const quoteToken = resolveTickerOnChain("USDC", chainId)
        return data.balances.some(
          (balance) =>
            balance.amount > BigInt(0) &&
            (balance.mint === baseToken?.address ||
              balance.mint === quoteToken?.address),
        )
      },
    },
  })
  if (hasBalances === false) {
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
            <span>Insufficient funds to place orders</span>
          </div>
        </ResponsiveTooltipTrigger>
        <ResponsiveTooltipContent>
          {ORDER_FORM_DEPOSIT_WARNING({ ticker })}
        </ResponsiveTooltipContent>
      </ResponsiveTooltip>
    )
  }
}
