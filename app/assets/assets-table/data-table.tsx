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
import { Settings2 } from "lucide-react"

import { TransferDialog } from "@/components/dialogs/transfer-dialog"
import { TableEmptyState } from "@/components/table-empty-state"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  showZeroRenegadeBalance: boolean
  showZeroL2Balance: boolean
  setShowZeroRenegadeBalance: (value: boolean) => void
  setShowZeroL2Balance: (value: boolean) => void
  isLongFormat: boolean
  setIsLongFormat: (value: boolean) => void
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLongFormat,
  setIsLongFormat,
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
    React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [sorting, setSorting] = React.useState<SortingState>([
    {
      id: "renegadeBalance",
      desc: true,
    },
  ])

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
  })

  return (
    <>
      <div className="flex items-center gap-2 pb-4">
        <div className="text-sm font-medium text-muted-foreground">
          Your assets on-chain and in Renegade. Click on a row to transfer.
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="ml-auto text-muted-foreground"
            >
              <Settings2 className="mr-2 h-4 w-4 text-muted-foreground" />
              View
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
            <DropdownMenuCheckboxItem
              checked={showZeroRenegadeBalance}
              onCheckedChange={value => setShowZeroRenegadeBalance(!!value)}
            >
              Show zero Renegade Balance
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={showZeroL2Balance}
              onCheckedChange={value => setShowZeroL2Balance(!!value)}
            >
              Show zero Arbitrum Balance
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={isLongFormat}
              onCheckedChange={value => setIsLongFormat(!!value)}
            >
              Long format
            </DropdownMenuCheckboxItem>
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
            {status !== "in relayer" ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <TableEmptyState type="assets" />
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map(row => {
                return (
                  <TransferDialog key={row.id} mint={row.getValue("mint")}>
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
