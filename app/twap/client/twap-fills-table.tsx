"use client";

import {
    type ColumnDef,
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    type SortingState,
    useReactTable,
} from "@tanstack/react-table";
import React from "react";
import { TableEmptyState } from "@/components/table-empty-state";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import type { TwapTableMeta, TwapTableRow } from "../lib/table-types";
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
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        initialState: {
            pagination: {
                pageIndex: 0,
                pageSize: 10,
            },
        },
        onSortingChange: setSorting,
        state: {
            sorting,
        },
    });

    return (
        <div>
            <div className="border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    const parentColumn = header.column.parent;
                                    const isGroupColumn = !!parentColumn;
                                    const parentColumns = parentColumn?.columns;
                                    const isFirstInGroup =
                                        isGroupColumn &&
                                        parentColumns?.[0]?.id === header.column.id;
                                    const isLastInGroup =
                                        isGroupColumn &&
                                        parentColumns?.[parentColumns.length - 1]?.id ===
                                            header.column.id;
                                    // Header group cell (colSpan > 1)
                                    const isHeaderGroup = header.colSpan > 1;
                                    const isClipSize = header.column.id === "sendAmount";
                                    const isSizeColumn =
                                        header.column.id === "receiveRenegade" ||
                                        header.column.id === "receiveBinance";

                                    return (
                                        <TableHead
                                            className={
                                                isHeaderGroup
                                                    ? "border-x"
                                                    : isFirstInGroup && !isClipSize && !isSizeColumn
                                                      ? "border-l"
                                                      : isLastInGroup
                                                        ? "border-r"
                                                        : ""
                                            }
                                            colSpan={header.colSpan}
                                            data-group={isGroupColumn ? parentColumn.id : undefined}
                                            data-group-first={isFirstInGroup || undefined}
                                            data-group-last={isLastInGroup || undefined}
                                            key={header.id}
                                        >
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
                                        {row.getVisibleCells().map((cell, cellIndex, cells) => {
                                            const parentColumn = cell.column.parent;
                                            const isGroupColumn = !!parentColumn;
                                            const parentColumns = parentColumn?.columns;
                                            const isFirstInGroup =
                                                isGroupColumn &&
                                                parentColumns?.[0]?.id === cell.column.id;
                                            const isLastInGroup =
                                                isGroupColumn &&
                                                parentColumns?.[parentColumns.length - 1]?.id ===
                                                    cell.column.id;
                                            const isClipSize = cell.column.id === "sendAmount";
                                            const isSizeColumn =
                                                cell.column.id === "receiveRenegade" ||
                                                cell.column.id === "receiveBinance";
                                            const isLastCell = cellIndex === cells.length - 1;
                                            const nextCell = cells[cellIndex + 1];
                                            const nextIsClipSize =
                                                nextCell?.column.id === "sendAmount";
                                            const nextIsSizeColumn =
                                                nextCell?.column.id === "receiveRenegade" ||
                                                nextCell?.column.id === "receiveBinance";

                                            // Add right border to all cells except: last cell, Clip Size, Size columns, or cells before Clip Size/Size
                                            const shouldAddRightBorder =
                                                !isLastCell &&
                                                !isClipSize &&
                                                !isSizeColumn &&
                                                !nextIsClipSize &&
                                                !nextIsSizeColumn;

                                            return (
                                                <TableCell
                                                    className={`border-border ${
                                                        isFirstInGroup &&
                                                        !isClipSize &&
                                                        !isSizeColumn
                                                            ? "border-l"
                                                            : ""
                                                    } ${
                                                        isLastInGroup || shouldAddRightBorder
                                                            ? "border-r"
                                                            : ""
                                                    }`}
                                                    data-group={
                                                        isGroupColumn ? parentColumn.id : undefined
                                                    }
                                                    data-group-first={isFirstInGroup || undefined}
                                                    data-group-last={isLastInGroup || undefined}
                                                    key={cell.id}
                                                >
                                                    {flexRender(
                                                        cell.column.columnDef.cell,
                                                        cell.getContext(),
                                                    )}
                                                </TableCell>
                                            );
                                        })}
                                    </TableRow>
                                );
                            })
                        ) : (
                            <TableEmptyState colSpan={columns.length} type="assets" />
                        )}
                    </TableBody>
                </Table>
            </div>
            {table.getRowModel().rows.length > 0 && table.getPageCount() > 1 ? (
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
            ) : null}
        </div>
    );
}

interface TwapFillsTableProps {
    meta: TwapTableMeta;
    rows: TwapTableRow[];
}

export function TwapFillsTable({ meta, rows }: TwapFillsTableProps) {
    const columns = React.useMemo(() => buildColumns(meta), [meta]);
    return <DataTable columns={columns} data={rows} />;
}
