import { Token, formatAmount, useWallet } from "@renegade-fi/react"
import { AlertTriangle } from "lucide-react"

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { useUSDPrice } from "@/hooks/use-usd-price"
import { Side } from "@/lib/constants/protocol"
import { INSUFFICIENT_BALANCE_TOOLTIP } from "@/lib/constants/tooltips"
import { cn } from "@/lib/utils"

export function InsufficientWarning({
  amount,
  baseMint,
  quoteMint,
  side,
  className,
}: {
  amount: bigint
  baseMint: `0x${string}`
  quoteMint: `0x${string}`
  side: Side
  className?: string
}) {
  const token = Token.findByAddress(side === Side.BUY ? quoteMint : baseMint)

  const { data: balance } = useWallet({
    query: {
      select: data =>
        data.balances.find(balance => balance.mint === token.address)?.amount,
    },
  })

  const usdPrice = useUSDPrice(Token.findByAddress(baseMint), amount)

  const formattedBalance = parseFloat(formatAmount(balance ?? BigInt(0), token))

  // const isInsufficient = balance ? balance < amount : true
  let isInsufficient = false
  if (side === Side.BUY) {
    isInsufficient = formattedBalance ? formattedBalance < usdPrice : true
  } else {
    isInsufficient = balance ? balance < amount : true
  }

  if (!isInsufficient) return null

  return (
    <Tooltip>
      <TooltipTrigger>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-yellow" />
          <span className={cn(className)}>
            Only part of the order will be filled
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>
          {INSUFFICIENT_BALANCE_TOOLTIP({
            ticker: token.ticker,
          })}
        </p>
      </TooltipContent>
    </Tooltip>
  )
}
