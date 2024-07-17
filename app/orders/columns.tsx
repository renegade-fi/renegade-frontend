"use client"

import { OrderMetadata, Token } from "@renegade-fi/react"
import { ColumnDef } from "@tanstack/react-table"
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react"

import { TokenIcon } from "@/components/token-icon"
import { Button } from "@/components/ui/button"

import { useSavingsPerFill } from "@/hooks/use-predicted-savings"
import {
  RENEGADE_PROTOCOL_FEE_RATE,
  RENEGADE_RELAYER_FEE_RATE,
} from "@/lib/constants/protocol"
import { formatNumber, formatTimestamp } from "@/lib/format"
import { cn } from "@/lib/utils"

export const columns: ColumnDef<OrderMetadata>[] = [
  // {
  //   id: 'select',
  //   header: ({ table }) => (
  //     <Checkbox
  //       checked={
  //         table.getIsAllPageRowsSelected() ||
  //         (table.getIsSomePageRowsSelected() && 'indeterminate')
  //       }
  //       onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)}
  //       aria-label="Select all"
  //     />
  //   ),
  //   cell: ({ row }) => (
  //     <Checkbox
  //       checked={row.getIsSelected()}
  //       onCheckedChange={value => row.toggleSelected(!!value)}
  //       aria-label="Select row"
  //     />
  //   ),
  //   enableSorting: false,
  //   enableHiding: false,
  // },
  {
    id: "status",
    accessorKey: "state",
    header: () => <div>Status</div>,
    cell: ({ row }) => {
      return <div>{row.getValue("status")}</div>
    },
  },
  {
    id: "side",
    accessorFn: row => {
      return row.data.side
    },
    header: () => <div>Side</div>,
    cell: ({ row }) => {
      return <div>{row.getValue("side")}</div>
    },
  },
  {
    id: "asset",
    accessorFn: row => {
      return row.data.base_mint
    },
    header: () => <div>Asset</div>,
    cell: ({ row }) => {
      const mint = row.getValue<`0x${string}`>("asset")
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
    id: "size",
    accessorFn: row => {
      return row.data.amount
    },
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
            Size
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
      const amount = row.getValue<bigint>("size")
      const mint = row.getValue<`0x${string}`>("asset")
      const decimals = Token.findByAddress(mint).decimals
      const formatted = formatNumber(amount, decimals)
      return <div className="pr-4 text-right">{formatted}</div>
    },
  },
  {
    id: "filled size",
    accessorFn: row => {
      return row.fills.reduce((acc, fill) => acc + fill.amount, BigInt(0))
    },
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
            Filled Size
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
      const size = row.getValue<bigint>("filled size")
      const mint = row.getValue<`0x${string}`>("asset")
      const decimals = Token.findByAddress(mint).decimals
      const formatted = formatNumber(size, decimals)
      return <div className="pr-4 text-right">{formatted}</div>
    },
  },
  {
    id: "saved",
    accessorFn: row => {
      return row.fills.reduce((acc, fill) => acc + fill.amount, BigInt(0))
    },
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
            Est. Saved
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
    // TODO: Add logic to calculate saved amount
    cell: function Cell({ row }) {
      // const totalSavings = useSavingsPerFill(
      //   row.original,
      //   RENEGADE_PROTOCOL_FEE_RATE + RENEGADE_RELAYER_FEE_RATE,
      // ).reduce((acc, curr) => acc + curr, 0)
      // console.log('🚀 ~ Cell ~ totalSavings:', totalSavings)
      // return <div className="pr-4 text-right">{totalSavings}</div>
      return <div className="pr-4 text-right">{"$10.87"}</div>
    },
  },
  {
    id: "created at",
    accessorKey: "created",
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
      const timestamp = row.getValue<bigint>("created at")
      const formatted = formatTimestamp(Number(timestamp))

      return <div className="pr-4 text-right font-medium">{formatted}</div>
    },
  },
  {
    id: "time to fill",
    accessorFn: row => {
      return row.fills.reduce((acc, fill) => acc + fill.amount, BigInt(0))
    },
    header: () => {
      return <div>Time to fill</div>
    },
    // TODO: Add logic to calculate time to fill
    cell: () => {
      return <div>{"2 min"}</div>
    },
  },
  // {
  //   id: 'actions',
  //   cell: ({ row }) => {
  //     const id = row.original.id

  //     return (
  //       <DropdownMenu>
  //         <DropdownMenuTrigger asChild>
  //           <Button variant="ghost" className="h-8 w-8 p-0">
  //             <span className="sr-only">Open menu</span>
  //             <MoreHorizontal className="h-4 w-4" />
  //           </Button>
  //         </DropdownMenuTrigger>
  //         <DropdownMenuContent align="end">
  //           <DropdownMenuLabel>Actions</DropdownMenuLabel>
  //           <DropdownMenuItem>Cancel Order</DropdownMenuItem>
  //           <DropdownMenuItem>Modify Order</DropdownMenuItem>
  //           <DropdownMenuItem onClick={() => navigator.clipboard.writeText(id)}>
  //             Copy Order ID
  //           </DropdownMenuItem>
  //           <DropdownMenuSeparator />
  //           <DropdownMenuItem>View order details</DropdownMenuItem>
  //         </DropdownMenuContent>
  //       </DropdownMenu>
  //     )
  //   },
  // },
]
