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
import React from "react";

import { TableEmptyState } from "@/components/table-empty-state";
import { TableSelect } from "@/components/table-select";
import { Button } from "@/components/ui/button";
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

import { DISPLAY_TOKENS } from "@/lib/token";
import { useCurrentChain } from "@/providers/state-provider/hooks";

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    initialIsWithdrawal?: string;
    initialStatus?: string;
    initialMint?: string;
}

const taskStates: { value: string; label: string }[] = [
    { label: "Queued", value: "Queued" },
    { label: "Completed", value: "Completed" },
    { label: "Failed", value: "Failed" },
];

const types = [
    { label: "Deposit", value: "Deposit" },
    { label: "Withdraw", value: "Withdraw" },
];

export function DataTable<TData, TValue>({
    columns,
    data,
    initialIsWithdrawal,
    initialStatus,
    initialMint,
}: DataTableProps<TData, TValue>) {
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = React.useState({});
    const [sorting, setSorting] = React.useState<SortingState>([
        {
            desc: true,
            id: "timestamp",
        },
    ]);

    const [isWithdrawal, setIsWithdrawal] = React.useState(initialIsWithdrawal ?? "");
    const [status, setStatus] = React.useState(initialStatus ?? "");
    const [mint, setMint] = React.useState(initialMint ?? "");
    const [isLongFormat, setIsLongFormat] = React.useState(false);

    const table = useReactTable({
        columns,
        data,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        meta: {
            isLongFormat,
        },
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
    });

    React.useEffect(() => {
        table.getColumn("status")?.setFilterValue(status);
    }, [status, table]);

    React.useEffect(() => {
        table.getColumn("mint")?.setFilterValue(mint);
    }, [mint, table]);

    React.useEffect(() => {
        table.getColumn("isWithdrawal")?.setFilterValue(isWithdrawal);
    }, [isWithdrawal, table]);

    const chainId = useCurrentChain();
    const tokens = DISPLAY_TOKENS({ chainId }).map((token) => ({
        label: token.ticker,
        value: token.address,
    }));

    return (
        <>
            <div className="flex flex-wrap items-center gap-2 lg:gap-4">
                <div className="text-sm font-medium text-muted-foreground">Filters</div>
                <TableSelect
                    onChange={setStatus}
                    placeholder="Status"
                    value={status}
                    values={taskStates}
                />
                <TableSelect onChange={setMint} placeholder="Asset" value={mint} values={tokens} />
                <TableSelect
                    onChange={setIsWithdrawal}
                    placeholder="Type"
                    value={isWithdrawal}
                    values={types}
                />
                {status || mint || isWithdrawal ? (
                    <Button
                        className="text-muted-foreground"
                        onClick={() => {
                            setStatus("");
                            setMint("");
                            setIsWithdrawal("");
                        }}
                        size="sm"
                        variant="outline"
                    >
                        Clear
                    </Button>
                ) : null}
                <div className="sm:ml-auto">
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
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => {
                                return (
                                    <TableRow
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
                                );
                            })
                        ) : (
                            <TableEmptyState colSpan={columns.length} type="transfer history" />
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="flex items-center justify-end space-x-2 py-4">
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
        </>
    );
}
