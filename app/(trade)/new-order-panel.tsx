import { Button } from '@/components/ui/button'

export function NewOrderPanel() {
  return (
    <aside className="flex min-h-full flex-col justify-between">
      <div className="flex flex-col">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            className="flex-1 border-l-0 font-serif text-3xl font-bold"
            size="xl"
          >
            BUY
          </Button>
          <Button
            variant="outline"
            className="flex-1 border-x-0 font-serif text-3xl font-bold"
            size="xl"
          >
            WETH
          </Button>
        </div>
        <div className="px-6 py-6 text-right font-mono text-4xl">
          4000&nbsp;<span className="font-serif font-bold">USDC</span>
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
          <div className="flex justify-between text-green-500">
            <span>Total savings vs. Binance</span>
            <span>$10.87</span>
          </div>
        </div>
        <div className="space-y-2 px-6">
          <Button
            variant="outline"
            className="w-full font-extended text-3xl"
            size="xl"
          >
            Sell WBTC
          </Button>
          <div className="space-y-0.5">
            <p className="text-xs text-gray-500">
              All orders are pre-trade and post-trade private.
            </p>
            <p className="text-xs text-gray-500">Learn more</p>
          </div>
        </div>
      </div>
      <div className="space-y-2 border-t border-input p-6">
        <div className="flex justify-between">
          <span>WETH</span>
          <span>1,785</span>
        </div>
        <div className="flex justify-between">
          <span>USDC</span>
          <span>176,911.00</span>
        </div>
      </div>
    </aside>
  )
}
