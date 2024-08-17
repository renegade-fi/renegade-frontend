import React from "react"

import Link from "next/link"

import { OrderMetadata } from "@renegade-fi/react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import { OrderDetailsSheet } from "@/app/trade/[base]/components/order-details/order-details-sheet"

import { TableEmptyState } from "@/components/table-empty-state"
import { TableSelect } from "@/components/table-select"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { DISPLAY_TOKENS } from "@/lib/token"

const statuses = [
  { value: "open", label: "Open" },
  { value: "filled", label: "Filled" },
  { value: "cancelled", label: "Cancelled" },
]

const sides = [
  { value: "buy", label: "Buy" },
  { value: "sell", label: "Sell" },
]

const tokens = DISPLAY_TOKENS().map((token) => ({
  value: token.address,
  label: token.ticker,
}))

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  initialStatus?: string
  initialSide?: string
  initialMint?: string
  initialVisibleColumns?: VisibilityState
  isTradePage?: boolean
}

export function DataTable<TData, TValue>({
  columns,
  data,
  initialStatus,
  initialSide,
  initialMint,
  initialVisibleColumns,
  isTradePage = false,
}: DataTableProps<TData, TValue>) {
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  )
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>(initialVisibleColumns ?? {})
  const [rowSelection, setRowSelection] = React.useState({})
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "created at", desc: true },
  ])

  const [status, setStatus] = React.useState(initialStatus ?? "")
  const [side, setSide] = React.useState(initialSide ?? "")
  const [mint, setMint] = React.useState(initialMint ?? "")
  const [isLongFormat, setIsLongFormat] = React.useState(false)

  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
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

  React.useEffect(() => {
    table.getColumn("status")?.setFilterValue(status)
  }, [status, table])

  React.useEffect(() => {
    table.getColumn("side")?.setFilterValue(side)
  }, [side, table])

  React.useEffect(() => {
    table.getColumn("asset")?.setFilterValue(mint)
  }, [mint, table])

  return (
    <>
      <div className="flex items-center gap-4 pb-4">
        <div className="text-sm font-medium text-muted-foreground">Filters</div>
        <TableSelect
          values={statuses}
          placeholder="Status"
          value={status}
          onChange={setStatus}
        />
        <TableSelect
          values={sides}
          placeholder="Side"
          value={side}
          onChange={setSide}
        />
        <TableSelect
          values={tokens}
          placeholder="Token"
          value={mint}
          onChange={setMint}
        />
        {status || side || mint ? (
          <Button
            variant="outline"
            size="sm"
            className="text-muted-foreground"
            onClick={() => {
              setStatus("")
              setSide("")
              setMint("")
            }}
          >
            Clear
          </Button>
        ) : null}
        <div className="ml-auto flex items-center space-x-2">
          <Switch
            checked={isLongFormat}
            onCheckedChange={(value) => setIsLongFormat(!!value)}
          />
          <Label htmlFor="long-format">Show decimals</Label>
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
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                return (
                  <OrderDetailsSheet
                    key={row.id}
                    order={row.original as OrderMetadata}
                  >
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                      className="cursor-pointer"
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
                  </OrderDetailsSheet>
                )
              })
            ) : (
              <TableEmptyState
                colSpan={columns.length}
                type="orders"
              />
            )}
          </TableBody>
        </Table>
      </div>
      {table.getRowModel().rows.length > 0 ? (
        isTradePage ? (
          <div className="flex flex-row-reverse pt-4">
            <Button
              asChild
              size="sm"
              variant="outline"
            >
              <Link href="/orders">View all</Link>
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        )
      ) : null}
    </>
  )
}
