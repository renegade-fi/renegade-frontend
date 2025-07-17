import {
    type ColumnDef,
    type ColumnFiltersState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    type SortingState,
    useReactTable,
    type VisibilityState,
} from "@tanstack/react-table";
import { DollarSign, EyeOff } from "lucide-react";
import React from "react";
import { RampDialog } from "@/app/rampv2/ramp-dialog";
import { TableEmptyState } from "@/components/table-empty-state";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Toggle } from "@/components/ui/toggle";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useWallets } from "@/hooks/use-wallets";

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    showZeroRenegadeBalance: boolean;
    showZeroOnChainBalance: boolean;
    setShowZeroRenegadeBalance: (value: boolean) => void;
    setShowZeroOnChainBalance: (value: boolean) => void;
}

export function DataTable<TData, TValue>({
    columns,
    data,
    setShowZeroOnChainBalance,
    setShowZeroRenegadeBalance,
    showZeroOnChainBalance,
    showZeroRenegadeBalance,
}: DataTableProps<TData, TValue>) {
    const { walletReadyState } = useWallets();
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
        renegadeUsdValue: true,
        onChainUsdValue: true,
        renegadeBalance: false,
        onChainBalance: false,
    });
    const [rowSelection, setRowSelection] = React.useState({});
    const [sorting, setSorting] = React.useState<SortingState>([
        {
            id: "onChainUsdValue",
            desc: true,
        },
    ]);
    const [isLongFormat, setIsLongFormat] = React.useState(false);

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
    });

    return (
        <>
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
                <div className="text-sm font-medium text-muted-foreground">
                    Your deposits inside of Renegade. Only you and your connected relayer can see
                    your balances.
                </div>
                <div className="flex items-center gap-2 lg:ml-auto">
                    <Tooltip>
                        <TooltipTrigger>
                            <Toggle
                                aria-label="Toggle USD"
                                onPressedChange={(value) => {
                                    value
                                        ? setColumnVisibility({
                                              renegadeUsdValue: true,
                                              onChainUsdValue: true,
                                              renegadeBalance: false,
                                              onChainBalance: false,
                                          })
                                        : setColumnVisibility({
                                              renegadeUsdValue: false,
                                              onChainUsdValue: false,
                                              renegadeBalance: true,
                                              onChainBalance: true,
                                          });
                                }}
                                pressed={
                                    columnVisibility.renegadeUsdValue &&
                                    columnVisibility.onChainUsdValue
                                }
                                size="sm"
                                variant="outline"
                            >
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </Toggle>
                        </TooltipTrigger>
                        <TooltipContent>USD Value</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger>
                            <Toggle
                                aria-label="Show zero balances"
                                onPressedChange={(value) => {
                                    setShowZeroOnChainBalance(!value);
                                    setShowZeroRenegadeBalance(!value);
                                }}
                                pressed={!showZeroOnChainBalance && !showZeroRenegadeBalance}
                                size="sm"
                                variant="outline"
                            >
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                            </Toggle>
                        </TooltipTrigger>
                        <TooltipContent>Hide zero balances</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger>
                            <Toggle
                                aria-label="Toggle decimal display"
                                className="w-8 font-mono text-xs text-muted-foreground data-[state=on]:text-muted-foreground"
                                onPressedChange={(value) => setIsLongFormat(value)}
                                pressed={isLongFormat}
                                size="sm"
                                variant="outline"
                            >
                                .00
                            </Toggle>
                        </TooltipTrigger>
                        <TooltipContent>Show decimals</TooltipContent>
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
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {/* row.length is always non-zero so check walletReadyState first */}
                        {walletReadyState !== "READY" ? (
                            <TableEmptyState colSpan={columns.length} type="assets" />
                        ) : table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => {
                                return (
                                    <RampDialog initialMint={row.getValue("mint")} key={row.id}>
                                        <TableRow
                                            className="cursor-pointer"
                                            data-state={row.getIsSelected() && "selected"}
                                            key={row.id}
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
                                    </RampDialog>
                                );
                            })
                        ) : null}
                    </TableBody>
                </Table>
            </div>
        </>
    );
}
