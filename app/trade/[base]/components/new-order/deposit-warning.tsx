import { AlertTriangle } from "lucide-react"

import {
  ResponsiveTooltip,
  ResponsiveTooltipContent,
  ResponsiveTooltipTrigger,
} from "@/components/ui/responsive-tooltip"

import { useBackOfQueueWallet } from "@/hooks/query/use-back-of-queue-wallet"
import { useMediaQuery } from "@/hooks/use-media-query"
import { ORDER_FORM_DEPOSIT_WARNING } from "@/lib/constants/tooltips"
import { resolveAddress } from "@/lib/token"
import { cn } from "@/lib/utils"

export function DepositWarning({
  className,
  baseMint,
  quoteMint,
}: {
  className?: string
  baseMint: `0x${string}`
  quoteMint: `0x${string}`
}) {
  const isDesktop = useMediaQuery("(min-width: 1024px)")
  const { data: hasBalances } = useBackOfQueueWallet({
    query: {
      select: (data) => {
        return data.balances.some(
          (balance) =>
            balance.amount > BigInt(0) &&
            (balance.mint === baseMint || balance.mint === quoteMint),
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
          {ORDER_FORM_DEPOSIT_WARNING({
            ticker: resolveAddress(baseMint).ticker,
          })}
        </ResponsiveTooltipContent>
      </ResponsiveTooltip>
    )
  }
}
