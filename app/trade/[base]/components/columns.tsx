"use client"

import { ColumnDef } from "@tanstack/react-table"

import { formatTimestamp } from "@/lib/format"

export interface FillTableData {
  index: number
  amount: string
  amountUSD: string
  timestamp: number
}

export const columns: ColumnDef<FillTableData>[] = [
  {
    accessorKey: "index",
    header: () => <div className="text-right">#</div>,
    cell: ({ row }) => {
      const index = row.getValue<number>("index")
      return <div className="text-right">{index + 1}</div>
    },
  },
  {
    accessorKey: "amount",
    header: () => <div className="text-right">Amount</div>,
    cell: ({ row }) => {
      const amount = row.getValue<number>("amount")
      return <div className="text-right">{amount}</div>
    },
  },
  {
    accessorKey: "amountUSD",
    header: () => <div className="text-right">Amount (USD)</div>,
    cell: ({ row }) => {
      const amountUSD = row.getValue<number>("amountUSD")
      return <div className="text-right">{amountUSD}</div>
    },
  },
  {
    accessorKey: "timestamp",
    header: () => <div className="text-right">Time</div>,
    cell: ({ row }) => {
      const timestamp = row.getValue<bigint>("timestamp")
      const formatted = formatTimestamp(Number(timestamp))

      return <div className="text-right font-medium">{formatted}</div>
    },
  },
]
