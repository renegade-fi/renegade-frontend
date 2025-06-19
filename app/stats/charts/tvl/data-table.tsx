import {
    type ColumnDef,
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    type SortingState,
    useReactTable,
    type VisibilityState,
} from "@tanstack/react-table";
import React from "react";
import { arbitrum, base } from "viem/chains";

import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    initialVisibility?: VisibilityState;
}

export function DataTable<TData, TValue>({
    columns,
    data,
    chainId,
}: DataTableProps<TData, TValue> & { chainId: number }) {
    const [visibility, setVisibility] = React.useState<VisibilityState>({});
    const [sorting, setSorting] = React.useState<SortingState>([
        {
            id: "totalTvlUsd",
            desc: true,
        },
    ]);

    const table = useReactTable({
        columns,
        data,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        onSortingChange: setSorting,
        onColumnVisibilityChange: setVisibility,
        state: {
            sorting,
            columnVisibility: visibility,
        },
    });

    // If a chain is selected, show only the relevant columns
    React.useEffect(() => {
        setVisibility({
            ticker: true,
            baseTvlUsd: chainId === base.id || chainId === 0,
            arbitrumTvlUsd: chainId === arbitrum.id || chainId === 0,
            totalTvlUsd: chainId === 0,
        });
    }, [chainId]);

    return (
        <>
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
                    {table.getRowModel().rows.map((row) => {
                        return (
                            <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id}>
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </TableCell>
                                ))}
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
            <div className="flex items-center justify-end space-x-2 p-6 pt-4">
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
    );
}
