import { Token } from "@renegade-fi/react"
import { ColumnDef } from "@tanstack/react-table"
import { formatUnits } from "viem/utils"

import { HistoryData } from "@/app/assets/page-client"

import { TokenIcon } from "@/components/token-icon"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { usePriceQuery } from "@/hooks/use-price-query"
import { amountTimesPrice } from "@/hooks/use-usd-price"
import {
  formatCurrencyFromString,
  formatNumber,
  formatTimestamp,
} from "@/lib/format"

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
    id: "usdValue",
    header: () => <div className="text-right">Amount ($)</div>,
    cell: function Cell({ row }) {
      const mint = row.getValue<`0x${string}`>("mint")
      const token = Token.findByAddress(mint)
      const { data: price } = usePriceQuery(mint)
      const amount = row.original.rawAmount
      const usdValueBigInt = amountTimesPrice(amount, price)
      const usdValue = formatUnits(usdValueBigInt, token.decimals)
      return (
        <div className="text-right">{formatCurrencyFromString(usdValue)}</div>
      )
    },
  },
  {
    accessorKey: "amount",
    header: () => <div className="text-right">Amount</div>,
    cell: ({ row, table }) => {
      const amount = row.original.rawAmount
      const token = Token.findByAddress(row.original.mint)
      const formatted = formatNumber(
        amount,
        token.decimals,
        table.options.meta?.isLongFormat,
      )
      const formattedLong = formatNumber(amount, token.decimals, true)
      const unformatted = formatUnits(amount, token.decimals)
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="text-right">{formatted}</div>
          </TooltipTrigger>
          <TooltipContent
            side="right"
            sideOffset={15}
          >
            <p className="font-sans">
              {table.options.meta?.isLongFormat ? unformatted : formattedLong}{" "}
              {token.ticker}
            </p>
          </TooltipContent>
        </Tooltip>
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
