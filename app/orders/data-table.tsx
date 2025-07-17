import type { OrderMetadata } from "@renegade-fi/react";
import {
    type ColumnDef,
    type ColumnFiltersState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    type SortingState,
    useReactTable,
    type VisibilityState,
} from "@tanstack/react-table";
import Link from "next/link";
import React from "react";

import { OrderDetailsSheet } from "@/app/trade/[base]/components/order-details/order-details-sheet";

import { TableEmptyState } from "@/components/table-empty-state";
import { TableSelect } from "@/components/table-select";
import { Button } from "@/components/ui/button";
import { MaintenanceButtonWrapper } from "@/components/ui/maintenance-button-wrapper";
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

import { useCancelAllOrders } from "@/hooks/use-cancel-all-orders";
import type { ExtendedOrderMetadata } from "@/hooks/use-order-table-data";
import { DISPLAY_TOKENS } from "@/lib/token";
import { cn } from "@/lib/utils";
import { useCurrentChain } from "@/providers/state-provider/hooks";

const statuses = [
    { value: "open", label: "Open" },
    { value: "filled", label: "Filled" },
    { value: "cancelled", label: "Cancelled" },
];

const sides = [
    { value: "buy", label: "Buy" },
    { value: "sell", label: "Sell" },
];

interface DataTableProps<_TData, _TValue> {
    columns: ColumnDef<ExtendedOrderMetadata, any>[];
    data: ExtendedOrderMetadata[];
    initialStatus?: string;
    initialSide?: string;
    initialMint?: string;
    initialVisibleColumns?: VisibilityState;
    isTradePage?: boolean;
}

const RECENT_ORDER_DURATION_MS = 7 * 1000;

export function DataTable<TData, TValue>({
    columns,
    data,
    initialStatus,
    initialSide,
    initialMint,
    initialVisibleColumns,
    isTradePage = false,
}: DataTableProps<TData, TValue>) {
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(
        initialVisibleColumns ?? {},
    );
    const [rowSelection, setRowSelection] = React.useState({});
    const [sorting, setSorting] = React.useState<SortingState>([{ id: "timestamp", desc: true }]);

    const [status, setStatus] = React.useState(initialStatus ?? "");
    const [side, setSide] = React.useState(initialSide ?? "");
    const [mint, setMint] = React.useState(initialMint ?? "");
    const [isLongFormat, setIsLongFormat] = React.useState(false);

    const { handleCancelAllOrders, isDisabled } = useCancelAllOrders();

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
    });

    const [recentOrders, setRecentOrders] = React.useState<Set<string>>(new Set());

    React.useEffect(() => {
        if (data.length === 0) return;

        const now = Date.now();
        const hasRecentOrders = data.some(
            (order) => now - Number(order.created) < RECENT_ORDER_DURATION_MS,
        );

        if (!hasRecentOrders && recentOrders.size === 0) return;

        setRecentOrders((prev) => {
            const newRecentOrders = new Set(prev);
            data.forEach((order) => {
                if (now - Number(order.created) < RECENT_ORDER_DURATION_MS) {
                    newRecentOrders.add(order.id);
                }
            });
            return newRecentOrders;
        });

        const interval = setInterval(() => {
            setRecentOrders((prev) => {
                const updated = new Set(prev);
                const currentTime = Date.now();
                data.forEach((order) => {
                    if (currentTime - Number(order.created) >= RECENT_ORDER_DURATION_MS) {
                        updated.delete(order.id);
                    }
                });
                return updated;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [data, recentOrders.size]);

    React.useEffect(() => {
        table.getColumn("status")?.setFilterValue(status);
    }, [status, table]);

    React.useEffect(() => {
        table.getColumn("side")?.setFilterValue(side);
    }, [side, table]);

    React.useEffect(() => {
        table.getColumn("mint")?.setFilterValue(mint);
    }, [mint, table]);

    const chainId = useCurrentChain();
    const tokens = DISPLAY_TOKENS({ chainId }).map((token) => ({
        value: token.address,
        label: token.ticker,
    }));

    return (
        <>
            <div className="flex flex-wrap items-center gap-2 lg:gap-4">
                <div className="text-sm font-medium text-muted-foreground">Filters</div>
                <TableSelect
                    onChange={setStatus}
                    placeholder="Status"
                    value={status}
                    values={statuses}
                />
                <TableSelect onChange={setSide} placeholder="Side" value={side} values={sides} />
                <TableSelect onChange={setMint} placeholder="Token" value={mint} values={tokens} />
                {status || side || mint ? (
                    <Button
                        className="text-muted-foreground"
                        onClick={() => {
                            setStatus("");
                            setSide("");
                            setMint("");
                        }}
                        size="sm"
                        variant="outline"
                    >
                        Clear
                    </Button>
                ) : null}
                <MaintenanceButtonWrapper messageKey="cancel">
                    <Button
                        className="text-muted-foreground sm:ml-auto"
                        disabled={isDisabled}
                        onClick={handleCancelAllOrders}
                        size="sm"
                        variant="outline"
                    >
                        Cancel all open orders
                    </Button>
                </MaintenanceButtonWrapper>
                <Tooltip>
                    <TooltipTrigger asChild>
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
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => {
                                return (
                                    <OrderDetailsSheet
                                        key={row.id}
                                        order={row.original as OrderMetadata}
                                    >
                                        <TableRow
                                            className={cn("relative cursor-pointer", {
                                                "animate-pulse bg-accent": recentOrders.has(
                                                    row.original.id,
                                                ),
                                            })}
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
                                    </OrderDetailsSheet>
                                );
                            })
                        ) : (
                            <TableEmptyState colSpan={columns.length} type="orders" />
                        )}
                    </TableBody>
                </Table>
            </div>
            {table.getRowModel().rows.length > 0 ? (
                isTradePage ? (
                    <div className="flex flex-row-reverse pt-4">
                        <Button asChild size="sm" variant="outline">
                            <Link href="/orders">View all</Link>
                        </Button>
                    </div>
                ) : (
                    <div className="flex items-center justify-end space-x-2 pt-4">
                        <Button
                            disabled={!table.getCanPreviousPage()}
                            onClick={() => table.previousPage()}
                            size="sm"
                            variant="outline"
                        >
                            Previous
                        </Button>
                        <Button
                            disabled={!table.getCanNextPage()}
                            onClick={() => table.nextPage()}
                            size="sm"
                            variant="outline"
                        >
                            Next
                        </Button>
                    </div>
                )
            ) : null}
        </>
    );
}
