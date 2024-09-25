import { OrderState, Token } from "@renegade-fi/react"
import { ColumnDef, RowData } from "@tanstack/react-table"
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react"
import { formatUnits } from "viem/utils"

import { AnimatedEllipsis } from "@/app/components/animated-ellipsis"

import { TokenIcon } from "@/components/token-icon"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { useCheckInsufficientBalancesForOrder } from "@/hooks/use-check-insufficient-balances-for-order"
import { ExtendedOrderMetadata } from "@/hooks/use-order-table-data"
import { useSavingsAcrossFillsQuery } from "@/hooks/use-savings-across-fills-query"
import { Side } from "@/lib/constants/protocol"
import { INSUFFICIENT_BALANCE_TOOLTIP } from "@/lib/constants/tooltips"
import {
  formatCurrency,
  formatNumber,
  formatOrderState,
  formatPercentage,
  formatTimestamp,
} from "@/lib/format"

declare module "@tanstack/react-table" {
  interface TableMeta<TData extends RowData> {
    isLongFormat: boolean
  }
}

export const columns: ColumnDef<ExtendedOrderMetadata>[] = [
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
    id: "notification",
    header: () => null,
    cell: function Cell({ row }) {
      const remainingAmount =
        row.original.data.amount -
        row.original.fills.reduce((acc, fill) => acc + fill.amount, BigInt(0))
      const { isInsufficient } = useCheckInsufficientBalancesForOrder({
        amount: remainingAmount,
        baseMint: row.original.data.base_mint,
        quoteMint: row.original.data.quote_mint,
        side: row.original.data.side === "Buy" ? Side.BUY : Side.SELL,
      })
      const token = Token.findByAddress(
        row.original.data.side === "Buy"
          ? row.original.data.quote_mint
          : row.original.data.base_mint,
      )

      if (
        [
          OrderState.Created,
          OrderState.Matching,
          OrderState.SettlingMatch,
        ].includes(row.original.state) &&
        isInsufficient
      ) {
        return (
          <div className="flex items-center justify-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="h-2 w-2 rounded-full bg-[var(--color-yellow)]" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-sans">
                  {INSUFFICIENT_BALANCE_TOOLTIP({ ticker: token.ticker })}
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        )
      }
      return null
    },
  },
  {
    id: "status",
    accessorKey: "state",
    header: () => <div>Status</div>,
    cell: ({ row }) => {
      return (
        <div className="whitespace-nowrap">
          {formatOrderState[row.getValue<OrderState>("status")]}
        </div>
      )
    },
    filterFn: (row, _, filterValue) => {
      if (filterValue === "open") {
        return [
          OrderState.Created,
          OrderState.Matching,
          OrderState.SettlingMatch,
        ].includes(row.getValue("status"))
      } else if (filterValue === "filled") {
        return row.getValue("status") === OrderState.Filled
      } else if (filterValue === "cancelled") {
        return row.getValue("status") === OrderState.Cancelled
      }
      return false
    },
  },
  {
    id: "side",
    accessorFn: (row) => {
      return row.data.side
    },
    header: () => <div>Side</div>,
    cell: ({ row }) => {
      return <div>{row.getValue("side")}</div>
    },
  },
  {
    id: "mint",
    accessorFn: (row) => {
      return row.data.base_mint
    },
    header: () => <div className="pr-7">Asset</div>,
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
    id: "usdValue",
    accessorFn: (row) => row.usdValue,
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
            Order Value
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
      const usdValue = row.original.usdValue
      const formatted = usdValue ? formatCurrency(usdValue) : "--"
      return <div className="pr-4 text-right">{formatted}</div>
    },
  },
  {
    id: "amount",
    accessorFn: (row) => {
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
    cell: ({ row, table }) => {
      const amount = row.getValue<bigint>("amount")
      const mint = row.getValue<`0x${string}`>("mint")
      const token = Token.findByAddress(mint)
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
            <div className="pr-4 text-right">{formatted}</div>
          </TooltipTrigger>
          <TooltipContent side="right">
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
    id: "filled",
    accessorFn: (row) => {
      return row.fills.reduce((acc, fill) => acc + fill.amount, BigInt(0))
    },
    header: () => <div className="w-[100px]">Filled</div>,
    cell: ({ row }) => {
      const filledAmount = row.getValue<bigint>("filled")
      const totalAmount = row.getValue<bigint>("amount")
      const percentageFilled =
        totalAmount > BigInt(0)
          ? (filledAmount * BigInt(100)) / totalAmount
          : BigInt(0)

      const percentageFilledNumber = Number(percentageFilled)
      const percentageFilledLabel = formatPercentage(
        Number(filledAmount),
        Number(totalAmount),
      )
      return (
        <>
          {!row.original.fills.length &&
          row.original.state !== OrderState.Cancelled ? (
            <div className="whitespace-nowrap">
              Finding counterparties
              <AnimatedEllipsis />
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2">
              {percentageFilledNumber ? (
                <Progress value={percentageFilledNumber} />
              ) : (
                <></>
              )}
              <div className="ml-auto text-right text-sm">
                {percentageFilledLabel}
              </div>
            </div>
          )}
        </>
      )
    },
  },
  {
    id: "saved",
    accessorFn: (row) => {
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
    cell: function Cell({ row }) {
      const { data } = useSavingsAcrossFillsQuery({
        order: row.original,
      })
      const totalSaved = data?.reduce((acc, result) => acc + result, 0)
      const formatted =
        Math.max(0, totalSaved) >= 0.01 ? formatCurrency(totalSaved) : "--"
      return <div className="pr-4 text-right">{formatted}</div>
    },
  },
  {
    id: "timestamp",
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
      const timestamp = row.getValue<bigint>("timestamp")
      const formatted = formatTimestamp(Number(timestamp))

      return (
        <div className="whitespace-nowrap pr-4 text-right">{formatted}</div>
      )
    },
  },
  // {
  // id: "time to fill",
  // accessorFn: row => {
  //   return row.fills.reduce((acc, fill) => acc + fill.amount, BigInt(0))
  // },
  // header: () => {
  //   return <div>Time to fill</div>
  // },
  // // TODO: Add logic to calculate time to fill
  // cell: () => {
  //   return <div>{"2 min"}</div>
  // },
  // },
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
