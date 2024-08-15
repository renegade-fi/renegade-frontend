import { Token } from "@renegade-fi/react"
import { ColumnDef } from "@tanstack/react-table"

import { HistoryData } from "@/app/assets/page-client"

import { TokenIcon } from "@/components/token-icon"

import { formatNumber, formatTimestamp } from "@/lib/format"

export const columns: ColumnDef<HistoryData>[] = [
  {
    accessorKey: "status",
    header: () => <div>Status</div>,
    cell: ({ row }) => {
      const status = row.getValue<`0x${string}`>("status")
      return <div>{status}</div>
    },
  },
  {
    accessorKey: "mint",
    header: () => <div>Asset</div>,
    cell: ({ row }) => {
      const mint = row.getValue<`0x${string}`>("mint")
      const token = Token.findByAddress(mint)
      return (
        <div className="flex items-center gap-2 font-medium">
          <TokenIcon
            size={20}
            ticker={token.ticker}
          />
          {token.ticker}
        </div>
      )
    },
  },
  {
    id: "isWithdrawal",
    accessorKey: "isWithdrawal",
    header: () => <div>Type</div>,
    cell: ({ row }) => {
      const isWithdrawal = row.getValue<boolean>("isWithdrawal")
      return <div>{isWithdrawal}</div>
    },
  },
  {
    accessorKey: "amount",
    header: () => <div className="text-right">Amount</div>,
    cell: ({ row, table }) => {
      const amount = row.original.rawAmount
      const token = Token.findByAddress(row.original.mint)
      return (
        <div className="text-right">
          {formatNumber(
            amount,
            token.decimals,
            table.options.meta?.isLongFormat,
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "timestamp",
    header: () => <div className="text-right">Time</div>,
    cell: ({ row }) => {
      const timestamp = row.getValue<number>("timestamp")
      const formatted = formatTimestamp(timestamp)
      return <div className="text-right">{formatted}</div>
    },
  },
]
