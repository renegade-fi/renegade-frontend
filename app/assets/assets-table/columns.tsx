import { Token } from "@renegade-fi/react"
import { ColumnDef } from "@tanstack/react-table"
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react"

import { BalanceData } from "@/app/assets/page-client"

import { TokenIcon } from "@/components/token-icon"
import { Button } from "@/components/ui/button"

export const columns: ColumnDef<BalanceData>[] = [
  {
    accessorKey: "mint",
    header: () => <div>Token</div>,
    cell: ({ row }) => {
      const mint = row.getValue<`0x${string}`>("mint")
      const token = Token.findByAddress(mint)
      return (
        <div className="flex items-center gap-2">
          <TokenIcon size={20} ticker={token.ticker} />
          {token.name}
        </div>
      )
    },
  },
  {
    accessorKey: "l2Balance",
    header: ({ column }) => (
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
          Arbitrum Balance
          {column.getIsSorted() === "asc" ? (
            <ChevronUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ChevronDown className="ml-2 h-4 w-4" />
          ) : (
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      </div>
    ),
    cell: ({ row }) => {
      const balance = row.getValue<string>("l2Balance")
      return <div className="pr-4 text-right">{balance}</div>
    },
  },
  {
    accessorKey: "renegadeBalance",
    header: ({ column }) => (
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
          Renegade Balance
          {column.getIsSorted() === "asc" ? (
            <ChevronUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ChevronDown className="ml-2 h-4 w-4" />
          ) : (
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      </div>
    ),
    cell: ({ row }) => {
      const balance = row.getValue<string>("renegadeBalance")
      return <div className="pr-4 text-right">{balance}</div>
    },
  },
]
