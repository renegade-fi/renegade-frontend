import React from "react"

import { useStatus } from "@renegade-fi/react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { DollarSign, EyeOff } from "lucide-react"

import { TransferDialog } from "@/components/dialogs/transfer/transfer-dialog"
import { TableEmptyState } from "@/components/table-empty-state"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Toggle } from "@/components/ui/toggle"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  showZeroRenegadeBalance: boolean
  showZeroL2Balance: boolean
  setShowZeroRenegadeBalance: (value: boolean) => void
  setShowZeroL2Balance: (value: boolean) => void
}

export function DataTable<TData, TValue>({
  columns,
  data,
  setShowZeroL2Balance,
  setShowZeroRenegadeBalance,
  showZeroL2Balance,
  showZeroRenegadeBalance,
}: DataTableProps<TData, TValue>) {
  const status = useStatus()
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  )
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({
      renegadeUsdValue: true,
      l2UsdValue: true,
      renegadeBalance: false,
      l2Balance: false,
    })
  const [rowSelection, setRowSelection] = React.useState({})
  const [sorting, setSorting] = React.useState<SortingState>([
    {
      id: "l2UsdValue",
      desc: true,
    },
  ])
  const [isLongFormat, setIsLongFormat] = React.useState(false)

  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    state: {
      columnFilters,
      columnVisibility,
      rowSelection,
      sorting,
    },
    meta: {
      isLongFormat,
    },
  })

  return (
    <>
      <div className="flex items-center pb-4">
        <div className="text-sm font-medium text-muted-foreground">
          Your deposits inside of Renegade. Only you and your connected relayer
          can see your balances.
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger>
              <Toggle
                aria-label="Toggle USD"
                pressed={
                  columnVisibility.renegadeUsdValue &&
                  columnVisibility.l2UsdValue
                }
                size="sm"
                variant="outline"
                onPressedChange={(value) => {
                  value
                    ? setColumnVisibility({
                        renegadeUsdValue: true,
                        l2UsdValue: true,
                        renegadeBalance: false,
                        l2Balance: false,
                      })
                    : setColumnVisibility({
                        renegadeUsdValue: false,
                        l2UsdValue: false,
                        renegadeBalance: true,
                        l2Balance: true,
                      })
                }}
              >
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>
              <p>USD Value</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger>
              <Toggle
                aria-label="Show zero balances"
                pressed={!showZeroL2Balance && !showZeroRenegadeBalance}
                size="sm"
                variant="outline"
                onPressedChange={(value) => {
                  setShowZeroL2Balance(!value)
                  setShowZeroRenegadeBalance(!value)
                }}
              >
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>
              <p>Hide zero balances</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger>
              <Toggle
                aria-label="Toggle decimal display"
                className="w-8 p-0 font-mono text-xs text-muted-foreground data-[state=on]:text-muted-foreground"
                pressed={isLongFormat}
                size="sm"
                variant="outline"
                onPressedChange={(value) => setIsLongFormat(value)}
              >
                .00
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>
              <p>Show decimals</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
      <div className="border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {status !== "in relayer" ? (
              <TableEmptyState
                colSpan={columns.length}
                type="assets"
              />
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                return (
                  <TransferDialog
                    key={row.id}
                    mint={row.getValue("mint")}
                  >
                    <TableRow
                      key={row.id}
                      className="cursor-pointer"
                      data-state={row.getIsSelected() && "selected"}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TransferDialog>
                )
              })
            ) : null}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
