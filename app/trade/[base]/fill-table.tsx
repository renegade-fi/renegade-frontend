'use client'

import { formatCurrency, formatNumber, formatTimestamp } from '@/lib/format'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { Token, useOrderHistory } from '@renegade-fi/react'
import invariant from 'tiny-invariant'

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

export function FillTable({ orderId }: { orderId: string }) {
  const { data } = useOrderHistory()
  const order = data?.get(orderId)
  invariant(order, 'Order not found')
  const token = Token.findByAddress(order.data.base_mint)
  const formattedFills = order.fills.map(fill => ({
    amount: formatNumber(fill.amount, token.decimals),
    price: Number(fill.price),
    timestamp: formatTimestamp(Number(fill.timestamp)),
  }))

  return (
    <Card className="border-0">
      <CardHeader>
        <CardTitle>Fills</CardTitle>
        <VisuallyHidden>
          <CardDescription>
            Fill details for {order.data.side} {order.data.amount}{' '}
            {Token.findByAddress(order.data.base_mint).ticker}
          </CardDescription>
        </VisuallyHidden>
      </CardHeader>

      <CardContent>
        <Table className="whitespace-nowrap">
          <TableHeader>
            <TableRow>
              <TableHead>Fill Amount</TableHead>
              <TableHead>Fill Value</TableHead>
              <TableHead>Timestamp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {formattedFills.map((fill, index) => (
              <TableRow className="border-0" key={fill.timestamp}>
                <TableCell>{fill.amount}</TableCell>
                <TableCell>
                  {formatCurrency(Number(fill.amount) * fill.price)}
                </TableCell>
                <TableCell>{fill.timestamp}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
