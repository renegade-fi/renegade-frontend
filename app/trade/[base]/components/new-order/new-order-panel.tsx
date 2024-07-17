import * as React from "react"

import { ChevronDown, Lock } from "lucide-react"

import { AmountShortcutButton } from "@/app/trade/[base]/components/new-order/amount-shortcut-button"
import { AssetsSection } from "@/app/trade/[base]/components/new-order/assets-section"
import { DenominationButton } from "@/app/trade/[base]/components/new-order/denomination-button"
import { FeesSection } from "@/app/trade/[base]/components/new-order/fees-sections"
import { SideButton } from "@/app/trade/[base]/components/new-order/side-button"

import { NewOrderStepper } from "@/components/dialogs/new-order-stepper/new-order-stepper"
import { TokenSelectDialog } from "@/components/dialogs/token-select-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

export function NewOrderPanel({
  base,
  side,
  isUSDCDenominated,
}: {
  base: string
  side: string
  isUSDCDenominated?: boolean
}) {
  const [amount, setAmount] = React.useState("")
  return (
    <aside>
      <div className="flex flex-col">
        <div className="flex items-center justify-between">
          <SideButton side={side} />
          <TokenSelectDialog>
            <Button
              variant="outline"
              className="flex-1 border-x-0 font-serif text-2xl font-bold"
              size="xl"
            >
              {base}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </TokenSelectDialog>
        </div>
        <div className="relative p-6">
          <Label className="font-sans text-muted-foreground">Amount</Label>
          <div className="flex items-baseline">
            <Input
              placeholder="0.00"
              className="rounded-none border-none px-0 text-right font-mono text-2xl placeholder:text-right focus-visible:ring-0"
              value={amount}
              onChange={e => setAmount(e.target.value)}
            />
            &nbsp;
            <DenominationButton
              base={base}
              isUSDCDenominated={isUSDCDenominated}
              onClearAmount={() => setAmount("")}
            />
          </div>
        </div>
        <div className="flex px-6 pb-6">
          <AmountShortcutButton
            amount={amount}
            base={isUSDCDenominated ? "USDC" : base}
            className="flex-1"
            percentage={0.25}
            onSetAmount={amount => setAmount(amount)}
          />
          <AmountShortcutButton
            amount={amount}
            base={isUSDCDenominated ? "USDC" : base}
            className="flex-1 border-x-0"
            percentage={0.5}
            onSetAmount={amount => setAmount(amount)}
          />
          <AmountShortcutButton
            amount={amount}
            base={isUSDCDenominated ? "USDC" : base}
            className="flex-1"
            percentage={1}
            onSetAmount={amount => setAmount(amount)}
          />
        </div>
        <Separator />
        <div className="space-y-3 whitespace-nowrap p-6 text-sm text-muted-foreground">
          <FeesSection
            amount={amount}
            base={base}
            isUSDCDenominated={isUSDCDenominated}
          />
        </div>
        <NewOrderStepper
          base={base}
          side={side}
          amount={amount}
          onSuccess={() => setAmount("")}
          isUSDCDenominated={isUSDCDenominated}
        >
          <Button
            variant="outline"
            className="mx-auto px-6 font-extended text-3xl"
            size="xl"
          >
            {side === "buy" ? "Buy" : "Sell"} {base}
          </Button>
        </NewOrderStepper>
        <div className="p-6">
          <Button
            variant="link"
            className="p-0 text-muted-foreground"
            size="sm"
          >
            <Lock className="mr-2 h-3 w-3" />
            All orders are pre-trade and post-trade private.
          </Button>
        </div>
        {}
      </div>
      <Separator />
      <div className="p-6">
        <AssetsSection base={base} />
      </div>
      <Separator />
    </aside>
  )
}
