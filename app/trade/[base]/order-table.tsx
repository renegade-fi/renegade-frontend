'use client'

import { formatNumber } from '@/lib/format'
import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { Token, useOrderHistory } from '@renegade-fi/react'
import { Ellipsis } from 'lucide-react'

import { GlowText } from '@/components/glow-text'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export function OrderTable({ base }: { base?: string }) {
  const { data, status } = useOrderHistory()
  const orderHistory = Array.from(data?.values() || [])
    // .filter(order => order.data.base_mint === Token.findByTicker(base).address)
    .sort((a, b) => Number(b.created) - Number(a.created))

  return (
    <Table className="whitespace-nowrap">
      <TableHeader>
        <TableRow>
          <TableHead>Status</TableHead>
          <TableHead>Side</TableHead>
          <TableHead>Asset</TableHead>
          <TableHead>Size</TableHead>
          <TableHead>Filled Size</TableHead>
          <TableHead>Order Value</TableHead>
          <TableHead>Est. Saved</TableHead>
          <TableHead>Created At</TableHead>
          <TableHead>Time to Fill</TableHead>
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orderHistory.map((order, index) => (
          <TableRow className="border-0" key={index}>
            <TableCell>{order.state}</TableCell>
            <TableCell>{order.data.side}</TableCell>
            <TableCell>
              {Token.findByAddress(order.data.base_mint).ticker}
            </TableCell>
            <TableCell>
              {formatNumber(
                order.data.amount,
                Token.findByAddress(order.data.base_mint).decimals,
              )}
            </TableCell>
            <TableCell>
              {formatNumber(
                order.data.amount,
                Token.findByAddress(order.data.base_mint).decimals,
              )}
            </TableCell>
            <TableCell>{'$12,345'}</TableCell>
            <TableCell>
              <GlowText className="bg-green-price" text="$10.87" />
            </TableCell>
            <TableCell>
              {new Date(Number(order.created)).toLocaleString('en-US', {
                month: 'short',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              })}
            </TableCell>
            <TableCell>{'<1min'}</TableCell>
            <TableCell>
              <Button
                variant="ghost"
                className="flex h-8 w-8 rounded-none p-0 data-[state=open]:bg-muted"
              >
                <DotsHorizontalIcon className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
