'use client'

import { formatNumber } from '@/lib/format'
import { useReadErc20BalanceOf } from '@/lib/generated'
import { DISPLAY_TOKENS } from '@/lib/token'
import { useBalances } from '@renegade-fi/react'
import { useAccount } from 'wagmi'

import { TokenIcon } from '@/components/token-icon'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { ArrowRightLeftIcon } from 'lucide-react'
import { TransferDialog } from '@/components/dialogs/transfer-dialog'

export function AssetsTable() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Balance on Arbitrum</TableHead>
          <TableHead>Transfer</TableHead>
          <TableHead>Balance on Renegade</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {DISPLAY_TOKENS().map((t, index) => (
          <Row key={index} token={t} />
        ))}
      </TableBody>
    </Table>
  )
}

function Row({
  token,
}: {
  token: {
    name: string
    ticker: string
    address: `0x${string}`
    decimals: number
  }
}) {
  const balances = useBalances()
  const { address, status } = useAccount()
  const { data: l2Balance } = useReadErc20BalanceOf({
    address: token.address,
    args: [address ?? '0x'],
  })
  const formattedL2Balance = formatNumber(
    l2Balance ?? BigInt(0),
    token.decimals,
  )
  return (
    <TableRow className="border-0">
      <TableCell>
        <div className="flex items-center gap-2">
          <TokenIcon size={20} ticker={token.ticker} />
          {token.name}
        </div>
      </TableCell>
      <TableCell>{formattedL2Balance}</TableCell>
      <TableCell>
        <TransferDialog base={token.address}>
          <Button
            variant="ghost"
            className="flex h-8 w-8 rounded-none p-0 data-[state=open]:bg-muted"
          >
            <ArrowRightLeftIcon className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </TransferDialog>
      </TableCell>
      <TableCell>
        {formatNumber(
          balances.get(token.address)?.amount ?? BigInt(0),
          token.decimals,
        )}
      </TableCell>
    </TableRow>
  )
}
