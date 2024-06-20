import { AssetsSection } from '@/app/trade/[base]/assets-section'
import { SideButton } from '@/app/trade/[base]/side-button'
import { TokenSelectDialog } from '@/components/dialogs/token-select-dialog'
import { GlowText } from '@/components/glow-text'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function NewOrderPanel({ base, side }: { base: string; side: string }) {
  return (
    <aside className="flex min-h-full flex-col justify-between">
      <div className="flex flex-col">
        <div className="flex items-center justify-between">
          <SideButton side={side} />
          <TokenSelectDialog>
            <Button
              variant="outline"
              className="flex-1 border-x-0 font-serif text-3xl font-bold"
              size="xl"
            >
              {base}
            </Button>
          </TokenSelectDialog>
        </div>
        <div className="relative flex items-center p-6 text-4xl">
          <Label className="absolute left-6 top-3 font-sans text-muted-foreground">
            Amount
          </Label>
          <Input
            placeholder="0.00"
            className="rounded-none border-none px-0 text-right font-mono text-4xl placeholder:text-right focus-visible:ring-0"
          />
          &nbsp;<span className="font-serif font-bold">USDC</span>
        </div>
        <div className="flex border-b border-input px-6 pb-6">
          <Button variant="outline" className="flex-1">
            25%
          </Button>
          <Button variant="outline" className="flex-1">
            50%
          </Button>
          <Button variant="outline" className="flex-1">
            MAX
          </Button>
        </div>
        <div className="space-y-6 p-6">
          <div className="flex justify-between">
            <span>Est. fees for your order</span>
            <span>$2.11</span>
          </div>
          <div className="flex justify-between">
            <span>Est. cost to trade on Binance</span>
            <span>$12.98</span>
          </div>
          <div className="flex justify-between font-bold">
            <span>Total savings vs. Binance</span>
            <GlowText className="bg-green-price" text="$10.87" />
          </div>
        </div>
        <div className="space-y-2 px-6">
          <Button
            variant="outline"
            className="w-full font-extended text-3xl"
            size="xl"
          >
            Sell {base}
          </Button>
          <p className="text-center text-xs text-muted">
            All orders are pre-trade and post-trade private.&nbsp;
            <span className="cursor-pointer text-xs text-muted transition-colors hover:text-primary">
              Learn more
            </span>
          </p>
        </div>
      </div>
      <div className="border-brand border-t">
        <AssetsSection base={base} />
      </div>
    </aside>
  )
}
