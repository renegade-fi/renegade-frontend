import React from "react"

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

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  initialIsWithdrawal?: string
  initialStatus?: string
  initialMint?: string
}

const taskStates: { value: string; label: string }[] = [
  { value: "Queued", label: "Queued" },
  { value: "Completed", label: "Completed" },
  { value: "Failed", label: "Failed" },
]

const tokens = DISPLAY_TOKENS().map(token => ({
  value: token.address,
  label: token.ticker,
}))

const types = [
  { value: "Deposit", label: "Deposit" },
  { value: "Withdraw", label: "Withdraw" },
]

export function DataTable<TData, TValue>({
  columns,
  data,
  initialIsWithdrawal,
  initialStatus,
  initialMint,
}: DataTableProps<TData, TValue>) {
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  )
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [sorting, setSorting] = React.useState<SortingState>([
    {
      id: "timestamp",
      desc: true,
    },
  ])

  const [isWithdrawal, setIsWithdrawal] = React.useState(
    initialIsWithdrawal ?? "",
  )
  const [status, setStatus] = React.useState(initialStatus ?? "")
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
    table.getColumn("mint")?.setFilterValue(mint)
  }, [mint, table])

  React.useEffect(() => {
    table.getColumn("isWithdrawal")?.setFilterValue(isWithdrawal)
  }, [isWithdrawal, table])

  return (
    <>
      <div className="flex items-center gap-2 pb-4">
        <div className="text-sm font-medium text-muted-foreground">Filters</div>
        <TableSelect
          values={taskStates}
          placeholder="Status"
          value={status}
          onChange={setStatus}
        />
        <TableSelect
          values={tokens}
          placeholder="Asset"
          value={mint}
          onChange={setMint}
        />
        <TableSelect
          values={types}
          placeholder="Type"
          value={isWithdrawal}
          onChange={setIsWithdrawal}
        />
        {status || mint || isWithdrawal ? (
          <Button
            variant="outline"
            size="sm"
            className="text-muted-foreground"
            onClick={() => {
              setStatus("")
              setMint("")
              setIsWithdrawal("")
            }}
          >
            Clear
          </Button>
        ) : null}
        <div className="ml-auto flex items-center space-x-2">
          <Switch
            checked={isLongFormat}
            onCheckedChange={value => setIsLongFormat(!!value)}
          />
          <Label htmlFor="long-format">Show decimals</Label>
        </div>
      </div>
      <div className="border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => {
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
              table.getRowModel().rows.map(row => {
                return (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map(cell => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                )
              })
            ) : (
              <TableEmptyState
                colSpan={columns.length}
                type="transfer history"
              />
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
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
    </>
  )
}
