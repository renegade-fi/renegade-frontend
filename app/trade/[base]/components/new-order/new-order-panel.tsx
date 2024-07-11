import { useState } from 'react'

import { ArrowRightLeft, ChevronDown, Lock } from 'lucide-react'

import { setUseUSDC } from '@/app/trade/[base]/actions'
import { AssetsSection } from '@/app/trade/[base]/assets-section'
import { AmountShortcutButton } from '@/app/trade/[base]/components/new-order/amount-shortcut-button'
import { FeesSection } from '@/app/trade/[base]/components/new-order/fees-sections'
import { SideButton } from '@/app/trade/[base]/components/new-order/side-button'

import { NewOrderDialog } from '@/components/dialogs/new-order-dialog'
import { TokenSelectDialog } from '@/components/dialogs/token-select-dialog'
import { GlowText } from '@/components/glow-text'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function NewOrderPanel<T extends string>({
  base,
  side,
  useUSDC,
}: {
  base: T
  side: string
  useUSDC?: boolean
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
              onClick={() => setUseUSDC(!useUSDC)}
            >
              {useUSDC ? 'USDC' : base}
              <ArrowRightLeft className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
        <div className="flex border-b border-input px-6 pb-6">
          <AmountShortcutButton
            amount={amount}
            base={useUSDC ? 'USDC' : base}
            className="flex-1 border-r-0"
            percentage={0.25}
            onSetAmount={amount => setAmount(amount)}
          />
          <AmountShortcutButton
            amount={amount}
            base={useUSDC ? 'USDC' : base}
            className="flex-1"
            percentage={0.5}
            onSetAmount={amount => setAmount(amount)}
          />
          <AmountShortcutButton
            amount={amount}
            base={useUSDC ? 'USDC' : base}
            className="flex-1 border-l-0"
            percentage={1}
            onSetAmount={amount => setAmount(amount)}
          />
        </div>
        <div className="space-y-3 p-6">
          <FeesSection amount={amount} base={useUSDC ? 'USDC' : base} />
        </div>
        <div className="group mx-6 space-y-2">
          <NewOrderDialog
            base={base}
            side={side}
            amount={amount}
            clearAmount={() => setAmount('')}
          >
            <Button
              variant="outline"
              className="w-full font-extended text-3xl"
              size="xl"
            >
              {side === 'buy' ? 'Buy' : 'Sell'} {base}
            </Button>
          </NewOrderDialog>
          <div className="grid place-items-center space-x-1 text-xs text-muted transition-colors group-hover:text-muted-foreground">
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
