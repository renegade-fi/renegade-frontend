'use client'

import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { OrderMetadata, Token, useOrderHistory } from '@renegade-fi/react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import numeral from 'numeral'
import { formatUnits } from 'viem'
import { useParams } from 'next/navigation'
import { useUSDPrice } from '@/hooks/use-usd-price'
import { CopyToClipboard } from '@/components/copy-to-clipboard'

dayjs.extend(relativeTime)

export function OrderHistory() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Side</TableHead>
          <TableHead>Base</TableHead>
          <TableHead className="text-right">Size</TableHead>
          <TableHead className="text-right">Filled Size</TableHead>
          <TableHead className="text-right">Order Value</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Order ID</TableHead>
          <TableHead className="text-right">Created At</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Buy</TableCell>
          <TableCell>WETH</TableCell>
          <TableCell className="text-right">1000</TableCell>
          <TableCell className="text-right">1000</TableCell>
          <TableCell className="text-right">1000</TableCell>
          <TableCell>
            <Badge className="text-xs" variant="outline">
              Open
            </Badge>
          </TableCell>
          <TableCell>
            <CopyToClipboard
              className="font-mono"
              text="3cf9098a-58eb-46e8-a803-870d73718dcc"
            />
          </TableCell>
          <TableCell className="whitespace-nowrap text-right">
            {new Date().toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Sell</TableCell>
          <TableCell>WBTC</TableCell>
          <TableCell className="text-right">3.2</TableCell>
          <TableCell className="text-right">3.2</TableCell>
          <TableCell className="text-right">3.2</TableCell>
          <TableCell>
            <Badge className="text-xs" variant="outline">
              Filled
            </Badge>
          </TableCell>
          <TableCell>
            <CopyToClipboard
              className="font-mono"
              text="2abbd0ac-bd69-4fd8-867f-2c536a05ba17"
            />
          </TableCell>
          <TableCell className="whitespace-nowrap text-right">
            {new Date().toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
    // <Card className="xl:col-span-2" x-chunk="dashboard-01-chunk-4">
    //   <CardHeader className="flex flex-row items-center">
    //     <div className="grid gap-2">
    //       <CardTitle>Orders</CardTitle>
    //       <CardDescription>Current orders of this quoter.</CardDescription>
    //     </div>
    //     <Button asChild size="sm" className="ml-auto gap-1">
    //       <Link href={`/quoter/orders`}>
    //         View All
    //         <ArrowUpRight className="h-4 w-4" />
    //       </Link>
    //     </Button>
    //   </CardHeader>
    //   <CardContent>
    //   </CardContent>
    // </Card>
  )
}
