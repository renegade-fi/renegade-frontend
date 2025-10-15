"use client";

import {
    type ColumnDef,
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    type SortingState,
    useReactTable,
} from "@tanstack/react-table";
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

    return (
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
                        <TableEmptyState colSpan={columns.length} type="assets" />
                    )}
                </TableBody>
            </Table>
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
