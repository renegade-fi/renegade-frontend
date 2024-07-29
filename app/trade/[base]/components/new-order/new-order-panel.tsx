import { Lock } from "lucide-react"

import { AssetsSectionWithDepositButton } from "@/app/trade/[base]/components/new-order/assets-section"
import { NewOrderForm } from "@/app/trade/[base]/components/new-order/new-order-form"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

import { Side } from "@/lib/constants/protocol"

export function NewOrderPanel({
  base,
  side,
  isUSDCDenominated,
}: {
  base: string
  side: Side
  isUSDCDenominated?: boolean
}) {
  return (
    <aside className="space-y-6">
      <NewOrderForm
        base={base}
        side={side}
        isUSDCDenominated={isUSDCDenominated}
      />
      <div className="px-6">
        <Button variant="link" className="p-0 text-muted-foreground" size="sm">
          <Lock className="mr-2 h-3 w-3" />
          All orders are pre-trade and post-trade private.
        </Button>
      </div>
      <Separator />
      <div className="mt-6 px-6 text-sm">
        <AssetsSectionWithDepositButton base={base} />
      </div>
      <Separator />
    </aside>
  )
}
