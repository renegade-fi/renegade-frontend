import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatNumber } from '@/lib/format'
import { Token, useOrderHistory } from '@renegade-fi/react'

export function OrderTable({ base }: { base: string }) {
  const { data, status } = useOrderHistory()
  const orderHistory = Array.from(data?.values() || [])
    // .filter(order => order.data.base_mint === Token.findByTicker(base).address)
    .sort((a, b) => Number(b.created) - Number(a.created))

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
          <TableHead>Created At</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orderHistory.map((order, index) => (
          <TableRow key={index}>
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
              {new Date(Number(order.created)).toLocaleString('en-US', {
                month: 'short',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              })}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
