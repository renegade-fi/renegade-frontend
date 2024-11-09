import { Token, useBackOfQueueWallet, useStatus } from "@renegade-fi/react"
import { AlertTriangle } from "lucide-react"

import {
  ResponsiveTooltip,
  ResponsiveTooltipContent,
  ResponsiveTooltipTrigger,
} from "@/components/ui/responsive-tooltip"

import { useMediaQuery } from "@/hooks/use-media-query"
import { ORDER_FORM_DEPOSIT_WARNING } from "@/lib/constants/tooltips"
import { cn } from "@/lib/utils"

export function DepositWarning({
  className,
  ticker,
}: {
  className?: string
  ticker: string
}) {
  const status = useStatus()
  const isDesktop = useMediaQuery("(min-width: 1024px)")
  const { data: hasBalances } = useBackOfQueueWallet({
    query: {
      select: (data) => {
        const baseToken = Token.findByTicker(ticker)
        const quoteToken = Token.findByTicker("USDC")
        return data.balances.some(
          (balance) =>
            balance.amount > BigInt(0) &&
            (balance.mint === baseToken.address ||
              balance.mint === quoteToken.address),
        )
      },
    },
  })
  if (hasBalances === false) {
    return (
      <div className="flex w-full items-center justify-center rounded-md bg-[#2A1700] p-3 text-center">
        <ResponsiveTooltip>
          <ResponsiveTooltipTrigger
            onClick={(e) => isDesktop && e.preventDefault()}
          >
            <div className={cn("flex items-center gap-2", className)}>
              <AlertTriangle className="h-4 w-4" />
              <span>Insufficient funds to place orders</span>
            </div>
          </ResponsiveTooltipTrigger>
          <ResponsiveTooltipContent>
            <p>{ORDER_FORM_DEPOSIT_WARNING({ ticker })}</p>
          </ResponsiveTooltipContent>
        </ResponsiveTooltip>
      </div>
    )
  }
}
