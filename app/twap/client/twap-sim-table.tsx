"use client";

import {
    type ColumnDef,
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    type SortingState,
    useReactTable,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { TriangleAlert } from "lucide-react";
import React from "react";
import { TableEmptyState } from "@/components/table-empty-state";
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from "@/components/ui/empty";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import type { TwapTableData } from "../lib/table-types";
import { buildColumns } from "./twap-table/columns";

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
}

function DataTable<TData, TValue>({ columns, data }: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = React.useState<SortingState>([
        {
            desc: false,
            id: "time",
        },
    ]);

    const table = useReactTable({
        columns,
        data,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        onSortingChange: setSorting,
        state: {
            sorting,
        },
    });

    const tableContainerRef = React.useRef<HTMLDivElement>(null);

    const rows = table.getRowModel().rows;

    const virtualizer = useVirtualizer({
        count: rows.length,
        getScrollElement: () => tableContainerRef.current,
        estimateSize: () => 32,
        overscan: 5,
    });

    return (
        <div className="border">
            {/* Fixed header outside of virtualized container */}
            <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b bg-background">
                    {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id}>
                            {headerGroup.headers.map((header) => {
                                return (
                                    <th
                                        key={header.id}
                                        className="h-10 px-2 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]"
                                    >
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                  header.column.columnDef.header,
                                                  header.getContext(),
                                              )}
                                    </th>
                                );
                            })}
                        </tr>
                    ))}
                </thead>
            </table>
            
            {/* Virtualized body */}
            <div ref={tableContainerRef} className="overflow-auto" style={{ height: "600px" }}>
                <div style={{ height: `${virtualizer.getTotalSize()}px`, position: "relative" }}>
                    <table className="w-full caption-bottom text-sm">
                        <tbody className="[&_tr:last-child]:border-0">
                            {rows.length ? (
                                virtualizer.getVirtualItems().map((virtualRow, index) => {
                                    const row = rows[virtualRow.index];
                                    return (
                                        <tr
                                            key={row.id}
                                            className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                                            data-state={row.getIsSelected() && "selected"}
                                            style={{
                                                height: `${virtualRow.size}px`,
                                                transform: `translateY(${virtualRow.start - index * virtualRow.size}px)`,
                                            }}
                                        >
                                            {row.getVisibleCells().map((cell) => (
                                                <td
                                                    key={cell.id}
                                                    className="p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]"
                                                >
                                                    {flexRender(
                                                        cell.column.columnDef.cell,
                                                        cell.getContext(),
                                                    )}
                                                </td>
                                            ))}
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={columns.length}>
                                        <TableEmptyState colSpan={columns.length} type="assets" />
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

interface TwapSimTableProps {
    table?: TwapTableData | null;
    error?: string;
}

export function TwapSimTable({ table, error }: TwapSimTableProps) {
    const columns = React.useMemo(() => {
        if (!table) return [];
        return buildColumns(table.meta);
    }, [table]);

    if (error) {
        return (
            <Empty>
                <EmptyHeader>
                    <EmptyMedia variant="icon">
                        <TriangleAlert />
                    </EmptyMedia>
                    <EmptyTitle>Simulation Error</EmptyTitle>
                    <EmptyDescription>{error}</EmptyDescription>
                </EmptyHeader>
            </Empty>
        );
    }

    if (!table) {
        return (
            <Empty>
                <EmptyDescription>Run a simulation to see the results...</EmptyDescription>
            </Empty>
        );
    }

    return <DataTable columns={columns} data={table.rows} />;
}
