import { Button } from '@/components/ui/button'

export function NewOrderPanel() {
  return (
    <aside className="min-w-full p-4">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="outline" className="flex-1">
            BUY
          </Button>
          <Button variant="outline" className="flex-1">
            WETH
          </Button>
        </div>
        <div className="text-4xl font-bold">4000 USDC</div>
        <div className="flex space-x-2">
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
        <div className="space-y-2">
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
        <Button className="w-full">Sell WBTC</Button>
        <p className="text-xs text-gray-500">
          All orders are pre-trade and post-trade private. Learn more
        </p>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>WETH</span>
            <span>1,785</span>
          </div>
          <div className="flex justify-between">
            <span>USDC</span>
            <span>176,911.00</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
