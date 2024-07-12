import { useState } from 'react'

import { ArrowRightLeft, ChevronDown, Lock } from 'lucide-react'

import { setUseUSDC } from '@/app/trade/[base]/actions'
import { AssetsSection } from '@/app/trade/[base]/assets-section'
import { AmountShortcutButton } from '@/app/trade/[base]/components/new-order/amount-shortcut-button'
import { FeesSection } from '@/app/trade/[base]/components/new-order/fees-sections'
import { SideButton } from '@/app/trade/[base]/components/new-order/side-button'

import { NewOrderStepper } from '@/components/dialogs/new-order-stepper/new-order-stepper'
import { TokenSelectDialog } from '@/components/dialogs/token-select-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function NewOrderPanel<T extends string>({
  base,
  side,
  isUSDCDenominated,
}: {
  base: T
  side: string
  isUSDCDenominated?: boolean
}) {
  const [amount, setAmount] = useState('')
  return (
    <aside className="flex min-h-full flex-col justify-between">
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
            <Button
              variant="ghost"
              className="h-12 flex-1 rounded-none p-0 px-2 font-serif text-2xl font-bold"
              onClick={() => setUseUSDC(!isUSDCDenominated)}
            >
              {isUSDCDenominated ? 'USDC' : base}
              <ArrowRightLeft className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
        <div className="flex border-b border-input px-6 pb-6">
          <AmountShortcutButton
            amount={amount}
            base={isUSDCDenominated ? 'USDC' : base}
            className="flex-1 border-r-0"
            percentage={0.25}
            onSetAmount={amount => setAmount(amount)}
          />
          <AmountShortcutButton
            amount={amount}
            base={isUSDCDenominated ? 'USDC' : base}
            className="flex-1"
            percentage={0.5}
            onSetAmount={amount => setAmount(amount)}
          />
          <AmountShortcutButton
            amount={amount}
            base={isUSDCDenominated ? 'USDC' : base}
            className="flex-1 border-l-0"
            percentage={1}
            onSetAmount={amount => setAmount(amount)}
          />
        </div>
        <div className="space-y-3 p-6 text-sm text-muted-foreground">
          <FeesSection
            amount={amount}
            base={isUSDCDenominated ? 'USDC' : base}
          />
        </div>
        <div className="mx-6 space-y-2">
          <NewOrderStepper
            base={base}
            side={side}
            amount={amount}
            clearAmount={() => setAmount('')}
            isUSDCDenominated={isUSDCDenominated}
          >
            <Button
              variant="outline"
              className="w-full font-extended text-3xl"
              size="xl"
            >
              {side === 'buy' ? 'Buy' : 'Sell'} {base}
            </Button>
          </NewOrderStepper>
          <div className="grid place-items-center space-x-1 text-xs text-muted transition-colors hover:text-muted-foreground">
            <span className="flex items-center gap-1">
              <Lock className="h-3 w-3" />
              All orders are pre-trade and post-trade private.
            </span>
            <p className="cursor-pointer">Learn more</p>
          </div>
        </div>
      </div>
      <div className="border-brand border-t">
        <AssetsSection base={base} />
      </div>
    </aside>
  )
}
