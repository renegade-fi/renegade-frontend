import { OrderHistory } from '@/components/order-history'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table'

export default function Home() {
  return (
    <div>
      <OrderPanel />
      <main className="flex flex-1 flex-col">
        <div className="flex items-center justify-between p-4">
          <BBOBanner />
          <div className="flex-1">
            <Chart />
          </div>
          <div className="p-4">
            <OrderTable />
          </div>
        </div>
      </main>
    </div>
  )
}

function BBOBanner() {
  return (
    <div className="flex items-center space-x-2">
      <span>BBO Feeds</span>
      <span>•</span>
      <span>Binance</span>
      <span>$3,756.89</span>
      <Badge variant="default">LIVE</Badge>
      <span>•</span>
      <span>Coinbase</span>
      <span>$3,756.89</span>
      <Badge variant="default">LIVE</Badge>
      <span>•</span>
      <span>Kraken</span>
      <span>$3,756.89</span>
      <Badge variant="default">LIVE</Badge>
      <span>•</span>
      <span>Okx</span>
      <span>$3,756.89</span>
      <Badge variant="default">LIVE</Badge>
    </div>
  )
}

function Chart() {
  return <div className=""></div>
}

function OrderTable() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Status</TableHead>
          <TableHead>Side</TableHead>
          <TableHead>Asset</TableHead>
          <TableHead>Size</TableHead>
          <TableHead>Filled Size</TableHead>
          <TableHead>Order Value</TableHead>
          <TableHead>ID</TableHead>
          <TableHead>Created At</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Open</TableCell>
          <TableCell>Buy</TableCell>
          <TableCell>WETH</TableCell>
          <TableCell>0.5</TableCell>
          <TableCell>0.1</TableCell>
          <TableCell>$12,345</TableCell>
          <TableCell>95322f18-2cea</TableCell>
          <TableCell>Jun 14, 09:17 AM</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Open</TableCell>
          <TableCell>Buy</TableCell>
          <TableCell>WETH</TableCell>
          <TableCell>0.5</TableCell>
          <TableCell>0.1</TableCell>
          <TableCell>$12,345</TableCell>
          <TableCell>95322f18-2cea</TableCell>
          <TableCell>Jun 14, 09:17 AM</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Filled</TableCell>
          <TableCell>Sell</TableCell>
          <TableCell>WBTC</TableCell>
          <TableCell>0.5</TableCell>
          <TableCell>0.1</TableCell>
          <TableCell>$12,345</TableCell>
          <TableCell>95322f18-2cea</TableCell>
          <TableCell>Jun 14, 09:17 AM</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Filled</TableCell>
          <TableCell>Sell</TableCell>
          <TableCell>WBTC</TableCell>
          <TableCell>0.5</TableCell>
          <TableCell>0.1</TableCell>
          <TableCell>$12,345</TableCell>
          <TableCell>95322f18-2cea</TableCell>
          <TableCell>Jun 14, 09:17 AM</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Cancelled</TableCell>
          <TableCell>Buy</TableCell>
          <TableCell>ARB</TableCell>
          <TableCell>200</TableCell>
          <TableCell>123</TableCell>
          <TableCell>$12,345</TableCell>
          <TableCell>95322f18-2cea</TableCell>
          <TableCell>Jun 14, 09:17 AM</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  )
}

function OrderPanel() {
  return (
    <div>
      <aside className="w-1/4 p-4">
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
    </div>
  )
}

{
  /* <div className="absolute inset-0 grid place-items-center">
        <p className="animate-price-red font-mono text-4xl">$70,123</p>
        <Button variant="shimmer">Connect Wallet</Button>
      </div> */
}
