import { Lock } from "lucide-react"

import { AssetsSectionWithDepositButton } from "@/app/trade/[base]/components/new-order/assets-section"
import { NewOrderForm } from "@/app/trade/[base]/components/new-order/new-order-form"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

import { Side } from "@/lib/constants/protocol"

export function NewOrderPanel({
  base,
  isUSDCDenominated,
}: {
  base: string
  isUSDCDenominated?: boolean
}) {
  return (
    <aside className="space-y-6">
      <div className="px-6 pt-6 text-sm">
        <AssetsSectionWithDepositButton base={base} />
      </div>
      <Separator />
      <NewOrderForm
        base={base}
        isUSDCDenominated={isUSDCDenominated}
      />
      <div className="px-6">
        <Button
          asChild
          className="text-pretty p-0 text-xs text-muted-foreground"
          variant="link"
        >
          <a
            // TODO: Add link to help center
            href={
              "https://help.renegade.fi/hc/en-us/articles/32760870056723-What-is-pre-trade-and-post-trade-privacy"
            }
            rel="noreferrer"
            target="_blank"
          >
            <Lock className="mr-2 h-3 w-3" />
            All orders are pre-trade and post-trade private.
          </a>
        </Button>
      </div>
    </aside>
  )
}
