import { OrderMetadata, OrderState, Token, useWallet } from "@renegade-fi/react"
import { AlertTriangle } from "lucide-react"

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { INSUFFICIENT_BALANCE_TOOLTIP } from "@/lib/constants/tooltips"

export function InsufficientWarning({ order }: { order: OrderMetadata }) {
  const remainingAmount =
    order.data.amount -
    order.fills.reduce((acc, fill) => acc + fill.amount, BigInt(0))

  const targetMint =
    order.data.side === "Buy" ? order.data.quote_mint : order.data.base_mint

  const { data: balance } = useWallet({
    query: {
      select: data =>
        data.balances.find(balance => balance.mint === targetMint)?.amount,
    },
  })

  if (order.state === OrderState.Filled || order.state === OrderState.Cancelled)
    return null

  const isInsufficient = balance ? balance < remainingAmount : true

  if (!isInsufficient) return null

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <div className="flex-1 border-0 text-sm font-bold">
              Insufficient {Token.findByAddress(targetMint)?.ticker} Balance
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {INSUFFICIENT_BALANCE_TOOLTIP({
              ticker: Token.findByAddress(targetMint)?.ticker,
            })}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
