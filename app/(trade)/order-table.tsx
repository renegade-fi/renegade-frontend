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
import { ResponsiveLine } from '@nivo/line'
import { Header } from '@/app/header'
import { Footer } from '@/app/footer'
import { BBOBanner } from '@/app/(trade)/bbo-banner'
import { NewOrderPanel } from '@/app/(trade)/new-order-panel'

export function OrderTable() {
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
