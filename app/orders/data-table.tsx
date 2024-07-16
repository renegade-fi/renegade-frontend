'use client'

import React from 'react'

import Link from 'next/link'

import { OrderMetadata } from '@renegade-fi/react'
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
} from '@tanstack/react-table'
import { Settings2 } from 'lucide-react'

import { SideSelect } from '@/app/orders/side-select'
import { StatusSelect } from '@/app/orders/status-select'
import { TokenSelect } from '@/app/orders/token-select'
import { OrderDetailsSheet } from '@/app/trade/[base]/order-details-sheet'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

export function DataTable<TData, TValue>({
  columns,
  data,
  initialStatus,
  initialSide,
  initialMint,
  initialVisibleColumns,
  isTradePage = false,
}: DataTableProps<TData, TValue> & {
  initialStatus?: string
  initialSide?: string
  initialMint?: string
  initialVisibleColumns?: VisibilityState
  isTradePage?: boolean
}) {
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  )
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>(initialVisibleColumns ?? {})
  const [rowSelection, setRowSelection] = React.useState({})
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'created at', desc: true },
  ])

  const [status, setStatus] = React.useState(initialStatus ?? '')
  const [side, setSide] = React.useState(initialSide ?? '')
  const [mint, setMint] = React.useState(initialMint ?? '')

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
  })

  React.useEffect(() => {
    table.getColumn('status')?.setFilterValue(status)
  }, [status, table])

  React.useEffect(() => {
    table.getColumn('side')?.setFilterValue(side)
  }, [side, table])

  React.useEffect(() => {
    table.getColumn('asset')?.setFilterValue(mint)
  }, [mint, table])

  return (
    <div>
      <div className="flex items-center gap-2 py-4">
        <div className="text-sm font-medium text-muted-foreground">Filters</div>
        <StatusSelect value={status} onChange={setStatus} />
        <SideSelect value={side} onChange={setSide} />
        <TokenSelect value={mint} onChange={setMint} />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="ml-auto">
              <Settings2 className="h-5 w-5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {table
              .getAllColumns()
              .filter(column => column.getCanHide())
              .map(column => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={value => column.toggleVisibility(!!value)}
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
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
                  <OrderDetailsSheet
                    key={row.id}
                    orderId={(row.original as OrderMetadata).id}
                  >
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && 'selected'}
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
                  </OrderDetailsSheet>
                )
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {table.getRowModel().rows.length > 0 ? (
        isTradePage ? (
          <div className="flex flex-row-reverse py-4">
            <Button asChild size="sm" variant="outline">
              <Link href="/orders">View all</Link>
            </Button>
          </div>
        ) : (
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
        )
      ) : null}
    </div>
  )
}
