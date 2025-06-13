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

import { DISPLAY_TOKENS } from "@/lib/token"
import { useCurrentChain } from "@/providers/state-provider/hooks"

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

  const chainId = useCurrentChain()
  const tokens = DISPLAY_TOKENS({ chainId }).map((token) => ({
    value: token.address,
    label: token.ticker,
  }))

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 lg:gap-4">
        <div className="text-sm font-medium text-muted-foreground">Filters</div>
        <TableSelect
          placeholder="Status"
          value={status}
          values={taskStates}
          onChange={setStatus}
        />
        <TableSelect
          placeholder="Asset"
          value={mint}
          values={tokens}
          onChange={setMint}
        />
        <TableSelect
          placeholder="Type"
          value={isWithdrawal}
          values={types}
          onChange={setIsWithdrawal}
        />
        {status || mint || isWithdrawal ? (
          <Button
            className="text-muted-foreground"
            size="sm"
            variant="outline"
            onClick={() => {
              setStatus("")
              setMint("")
              setIsWithdrawal("")
            }}
          >
            Clear
          </Button>
        ) : null}
        <div className="sm:ml-auto">
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                aria-label="Toggle decimal display"
                className="w-8 font-mono text-xs text-muted-foreground data-[state=on]:text-muted-foreground"
                pressed={isLongFormat}
                size="sm"
                variant="outline"
                onPressedChange={(value) => setIsLongFormat(value)}
              >
                .00
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Toggle decimals</TooltipContent>
          </Tooltip>
        </div>
      </div>
      <div className="mt-2 border lg:mt-4">
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
                  <TableRow
                    key={row.id}
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
          disabled={!table.getCanPreviousPage()}
          size="sm"
          variant="outline"
          onClick={() => table.previousPage()}
        >
          Previous
        </Button>
        <Button
          disabled={!table.getCanNextPage()}
          size="sm"
          variant="outline"
          onClick={() => table.nextPage()}
        >
          Next
        </Button>
      </div>
    </>
  )
}
