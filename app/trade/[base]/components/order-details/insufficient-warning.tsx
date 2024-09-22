import { AlertTriangle } from "lucide-react"

import { TransferDialog } from "@/components/dialogs/transfer/transfer-dialog"
import { Button } from "@/components/ui/button"
import {
  ResponsiveTooltip,
  ResponsiveTooltipContent,
  ResponsiveTooltipTrigger,
} from "@/components/ui/responsive-tooltip"

import { useCheckInsufficientBalancesForOrder } from "@/hooks/use-check-insufficient-balances-for-order"
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
  withDialog = false,
}: {
  amount: bigint
  baseMint: `0x${string}`
  className?: string
  quoteMint: `0x${string}`
  richColors?: boolean
  side: Side
  withDialog?: boolean
}) {
  const { isInsufficient, token } = useCheckInsufficientBalancesForOrder({
    amount,
    baseMint,
    quoteMint,
    side,
  })

  if (!isInsufficient) return null

  const warningContent = (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="h-2 w-2 rounded-full bg-[var(--color-yellow)]" />
      <span>Only part of the order will be filled.</span>
    </div>
  )

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
          {withDialog ? (
            <TransferDialog mint={side === Side.BUY ? quoteMint : baseMint}>
              <Button variant="ghost">{warningContent}</Button>
            </TransferDialog>
          ) : (
            warningContent
          )}
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
