import { Lock } from "lucide-react"

import { AssetsSection } from "@/app/trade/[base]/components/new-order/assets-section"
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
    <aside>
      <NewOrderForm
        base={base}
        side={side}
        isUSDCDenominated={isUSDCDenominated}
      />
      <div className="p-6">
        <Button variant="link" className="p-0 text-muted-foreground" size="sm">
          <Lock className="mr-2 h-3 w-3" />
          All orders are pre-trade and post-trade private.
        </Button>
      </div>
      <Separator />
      <div className="p-6">
        <AssetsSection base={base} />
      </div>
      <Separator />
    </aside>
  )
}
