import { ColumnDef } from "@tanstack/react-table"
import dayjs from "dayjs"

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { formatTimestampReadable, formatTimestamp } from "@/lib/format"

export interface FillTableData {
  index: number
  amount: string
  amountLong: string
  amountUSD: string
  timestamp: number
  createdAt: number
  ticker: string
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
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="text-right">{amount}</div>
          </TooltipTrigger>
          <TooltipContent side="right">
            {`${row.original.amountLong} ${row.original.ticker}`}
          </TooltipContent>
        </Tooltip>
      )
    },
  },
  {
    accessorKey: "amountUSD",
    header: () => <div className="text-right">Value ($)</div>,
    cell: ({ row }) => {
      const amountUSD = row.getValue<number>("amountUSD")
      return <div className="text-right">{amountUSD}</div>
    },
  },
  {
    accessorKey: "timestamp",
    header: () => <div className="text-right">Time</div>,
    cell: ({ row, table }) => {
      const timestamp = row.getValue<bigint>("timestamp")
      const formatted = formatTimestamp(Number(timestamp))

      const diffMs = dayjs(Number(timestamp)).diff(
        dayjs(row.original.createdAt),
      )
      const formattedDiff = formatTimestampReadable(diffMs)
      let diffLabel = `${formattedDiff} since creation`

      // Get the previous row, if it exists
      const currentRowIndex = row.index
      const allRows = table.getRowModel().rows
      const previousRow =
        currentRowIndex > 0 ? allRows[currentRowIndex - 1] : null

      if (previousRow) {
        const previousTimestamp = previousRow.getValue<bigint>("timestamp")
        const timeDiffMs = dayjs(Number(timestamp)).diff(
          dayjs(Number(previousTimestamp)),
        )
        const formattedTimeDiff = formatTimestampReadable(timeDiffMs)
        diffLabel += ` | ${formattedTimeDiff} since previous fill`
      }

      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="text-right font-medium">{formatted}</div>
          </TooltipTrigger>
          <TooltipContent side="right">{diffLabel}</TooltipContent>
        </Tooltip>
      )
    },
  },
]
