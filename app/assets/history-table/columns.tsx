import { Token } from "@renegade-fi/react"
import { ColumnDef } from "@tanstack/react-table"
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react"

import { HistoryData } from "@/app/assets/page-client"

import { TokenIcon } from "@/components/token-icon"
import { Button } from "@/components/ui/button"

import { formatTimestamp } from "@/lib/format"

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
          <TokenIcon size={20} ticker={token.ticker} />
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
      return <div>{isWithdrawal ? "Withdraw" : "Deposit"}</div>
    },
  },
  {
    accessorKey: "amount",
    header: ({ column }) => {
      return (
        <div className="flex flex-row-reverse">
          <Button
            variant="ghost"
            onClick={() => {
              const isSorted = column.getIsSorted()
              if (isSorted === "desc") {
                column.toggleSorting(false)
              } else if (isSorted === "asc") {
                column.clearSorting()
              } else {
                column.toggleSorting(true)
              }
            }}
          >
            Amount
            {column.getIsSorted() === "asc" ? (
              <ChevronUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === "desc" ? (
              <ChevronDown className="ml-2 h-4 w-4" />
            ) : (
              <ChevronsUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        </div>
      )
    },
    cell: ({ row }) => {
      const amount = row.getValue<bigint>("amount")
      return <div className="pr-4 text-right">{amount}</div>
    },
  },
  {
    accessorKey: "timestamp",
    header: ({ column }) => {
      return (
        <div className="flex flex-row-reverse">
          <Button
            variant="ghost"
            onClick={() => {
              const isSorted = column.getIsSorted()
              if (isSorted === "desc") {
                column.toggleSorting(false)
              } else if (isSorted === "asc") {
                column.clearSorting()
              } else {
                column.toggleSorting(true)
              }
            }}
          >
            Time
            {column.getIsSorted() === "asc" ? (
              <ChevronUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === "desc" ? (
              <ChevronDown className="ml-2 h-4 w-4" />
            ) : (
              <ChevronsUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        </div>
      )
    },
    cell: ({ row }) => {
      const timestamp = row.getValue<number>("timestamp")
      const formatted = formatTimestamp(timestamp)
      return <div className="pr-4 text-right">{formatted}</div>
    },
  },
]
