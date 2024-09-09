import { Token, useBackOfQueueWallet } from "@renegade-fi/react"
import { AlertTriangle } from "lucide-react"
import { formatUnits } from "viem/utils"

import {
  ResponsiveTooltip,
  ResponsiveTooltipContent,
  ResponsiveTooltipTrigger,
} from "@/components/ui/responsive-tooltip"

import { useUSDPrice } from "@/hooks/use-usd-price"
import { Side } from "@/lib/constants/protocol"
import { INSUFFICIENT_BALANCE_TOOLTIP } from "@/lib/constants/tooltips"
import { cn } from "@/lib/utils"

export function InsufficientWarning({
  amount,
  baseMint,
  className,
  quoteMint,
  richColors = false,
  side,
}: {
  amount: bigint
  baseMint: `0x${string}`
  className?: string
  quoteMint: `0x${string}`
  richColors?: boolean
  side: Side
}) {
  const baseToken = Token.findByAddress(baseMint)
  const quoteToken = Token.findByAddress(quoteMint)
  const token = side === Side.BUY ? quoteToken : baseToken

  const { data: balance } = useBackOfQueueWallet({
    query: {
      select: (data) =>
        data.balances.find((balance) => balance.mint === token.address)?.amount,
    },
  })

  const usdPrice = useUSDPrice(Token.findByAddress(baseMint), amount)

  let isInsufficient = false
  if (side === Side.BUY) {
    // Adjust by # of other token's decimals
    const formattedUsdPrice = formatUnits(
      usdPrice,
      side === Side.BUY ? baseToken.decimals : quoteToken.decimals,
    )
    isInsufficient = balance
      ? parseFloat(formatUnits(balance, token.decimals)) <
        parseFloat(formattedUsdPrice)
      : true
  } else {
    isInsufficient = balance ? balance < amount : true
  }

  if (!isInsufficient) return null
  return (
    <div
      className={cn({
        "flex w-full items-center justify-center rounded-md bg-[#2A1700] p-3 text-center":
          richColors,
        "flex items-center": !richColors,
      })}
    >
      <ResponsiveTooltip>
        <ResponsiveTooltipTrigger>
          <div className={cn("flex items-center gap-2", className)}>
            <AlertTriangle className="h-4 w-4" />
            <span>Only part of the order will be filled.</span>
          </div>
        </ResponsiveTooltipTrigger>
        <ResponsiveTooltipContent>
          <p>
            {INSUFFICIENT_BALANCE_TOOLTIP({
              ticker: token.ticker,
            })}
          </p>
        </ResponsiveTooltipContent>
      </ResponsiveTooltip>
    </div>
  )
}
