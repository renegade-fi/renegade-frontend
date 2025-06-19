import { OrderState } from "@renegade-fi/react";
import type { ColumnDef, RowData } from "@tanstack/react-table";
import { ChevronDown, ChevronsUpDown, ChevronUp } from "lucide-react";
import { formatUnits } from "viem/utils";

import { AnimatedEllipsis } from "@/app/components/animated-ellipsis";

import { TokenIcon } from "@/components/token-icon";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { useBackOfQueueWallet } from "@/hooks/query/use-back-of-queue-wallet";
import { useSavingsAcrossFillsQuery } from "@/hooks/savings/use-savings-across-fills-query";
import { useIsOrderUndercapitalized } from "@/hooks/use-is-order-undercapitalized";
import type { ExtendedOrderMetadata } from "@/hooks/use-order-table-data";
import { Side } from "@/lib/constants/protocol";
import { UNDERCAPITALIZED_ORDER_TOOLTIP } from "@/lib/constants/tooltips";
import {
    formatCurrency,
    formatNumber,
    formatOrderState,
    formatPercentage,
    formatTimestamp,
} from "@/lib/format";
import { resolveAddress } from "@/lib/token";

declare module "@tanstack/react-table" {
    interface TableMeta<TData extends RowData> {
        isLongFormat: boolean;
    }
}

export const columns: ColumnDef<ExtendedOrderMetadata>[] = [
    {
        id: "notification",
        header: () => null,
        cell: function Cell({ row }) {
            const remainingAmount =
                row.original.data.amount -
                row.original.fills.reduce((acc, fill) => acc + fill.amount, BigInt(0));
            const { isUndercapitalized } = useIsOrderUndercapitalized({
                amount: remainingAmount,
                baseMint: row.original.data.base_mint,
                quoteMint: row.original.data.quote_mint,
                side: row.original.data.side === "Buy" ? Side.BUY : Side.SELL,
            });
            const token = resolveAddress(
                row.original.data.side === "Buy"
                    ? row.original.data.quote_mint
                    : row.original.data.base_mint,
            );

            if (
                [OrderState.Created, OrderState.Matching, OrderState.SettlingMatch].includes(
                    row.original.state,
                ) &&
                isUndercapitalized
            ) {
                return (
                    <div className="flex items-center justify-center">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="h-2 w-2 rounded-full bg-[var(--color-yellow)]" />
                            </TooltipTrigger>
                            <TooltipContent>
                                {UNDERCAPITALIZED_ORDER_TOOLTIP({ ticker: token.ticker })}
                            </TooltipContent>
                        </Tooltip>
                    </div>
                );
            }
            return null;
        },
    },
    {
        id: "status",
        accessorKey: "state",
        header: () => <div>Status</div>,
        cell: function Cell({ row }) {
            const remainingAmount =
                row.original.data.amount -
                row.original.fills.reduce((acc, fill) => acc + fill.amount, BigInt(0));
            const { isUndercapitalized } = useIsOrderUndercapitalized({
                amount: remainingAmount,
                baseMint: row.original.data.base_mint,
                quoteMint: row.original.data.quote_mint,
                side: row.original.data.side === "Buy" ? Side.BUY : Side.SELL,
            });
            let status: string = formatOrderState[row.getValue<OrderState>("status")];
            if (isUndercapitalized && status === "Open") {
                status = "Undercapitalized";
            }
            return <div className="whitespace-nowrap">{status}</div>;
        },
        filterFn: (row, _, filterValue) => {
            if (filterValue === "open") {
                return [OrderState.Created, OrderState.Matching, OrderState.SettlingMatch].includes(
                    row.getValue("status"),
                );
            } else if (filterValue === "filled") {
                return row.getValue("status") === OrderState.Filled;
            } else if (filterValue === "cancelled") {
                return row.getValue("status") === OrderState.Cancelled;
            }
            return false;
        },
    },
    {
        id: "side",
        accessorFn: (row) => {
            return row.data.side;
        },
        header: () => <div>Side</div>,
        cell: ({ row }) => {
            return <div>{row.getValue("side")}</div>;
        },
    },
    {
        id: "mint",
        accessorFn: (row) => {
            return row.data.base_mint;
        },
        header: () => <div className="pr-7">Asset</div>,
        cell: ({ row }) => {
            const mint = row.getValue<`0x${string}`>("mint");
            const token = resolveAddress(mint);
            return (
                <div className="flex items-center gap-2 font-medium">
                    <TokenIcon size={20} ticker={token.ticker} />
                    {token.ticker}
                </div>
            );
        },
    },
    {
        id: "usdValue",
        accessorFn: (row) => row.usdValue,
        header: ({ column }) => {
            return (
                <div className="flex flex-row-reverse">
                    <Button
                        variant="ghost"
                        onClick={() => {
                            const isSorted = column.getIsSorted();
                            if (isSorted === "desc") {
                                column.toggleSorting(false);
                            } else if (isSorted === "asc") {
                                column.clearSorting();
                            } else {
                                column.toggleSorting(true);
                            }
                        }}
                    >
                        Order Value
                        {column.getIsSorted() === "asc" ? (
                            <ChevronUp className="ml-2 h-4 w-4" />
                        ) : column.getIsSorted() === "desc" ? (
                            <ChevronDown className="ml-2 h-4 w-4" />
                        ) : (
                            <ChevronsUpDown className="ml-2 h-4 w-4" />
                        )}
                    </Button>
                </div>
            );
        },
        cell: ({ row }) => {
            const usdValue = row.original.usdValue;
            const formatted = usdValue ? formatCurrency(usdValue) : "--";
            return <div className="pr-4 text-right">{formatted}</div>;
        },
    },
    {
        id: "amount",
        accessorFn: (row) => {
            return row.data.amount;
        },
        header: ({ column }) => {
            return (
                <div className="flex flex-row-reverse">
                    <Button
                        variant="ghost"
                        onClick={() => {
                            const isSorted = column.getIsSorted();
                            if (isSorted === "desc") {
                                column.toggleSorting(false);
                            } else if (isSorted === "asc") {
                                column.clearSorting();
                            } else {
                                column.toggleSorting(true);
                            }
                        }}
                    >
                        Size
                        {column.getIsSorted() === "asc" ? (
                            <ChevronUp className="ml-2 h-4 w-4" />
                        ) : column.getIsSorted() === "desc" ? (
                            <ChevronDown className="ml-2 h-4 w-4" />
                        ) : (
                            <ChevronsUpDown className="ml-2 h-4 w-4" />
                        )}
                    </Button>
                </div>
            );
        },
        cell: ({ row, table }) => {
            const amount = row.getValue<bigint>("amount");
            const mint = row.getValue<`0x${string}`>("mint");
            const token = resolveAddress(mint);
            const formatted = formatNumber(
                amount,
                token.decimals,
                table.options.meta?.isLongFormat,
            );
            const formattedLong = formatNumber(amount, token.decimals, true);
            const unformatted = formatUnits(amount, token.decimals);
            return (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="pr-4 text-right">{formatted}</div>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                        {`${table.options.meta?.isLongFormat ? unformatted : formattedLong} ${token.ticker}`}
                    </TooltipContent>
                </Tooltip>
            );
        },
    },
    {
        id: "filled",
        accessorFn: (row) => {
            return row.fills.reduce((acc, fill) => acc + fill.amount, BigInt(0));
        },
        header: () => <div className="w-[100px]">Filled</div>,
        cell: function Cell({ row }) {
            const filledAmount = row.getValue<bigint>("filled");
            const totalAmount = row.getValue<bigint>("amount");
            const percentageFilled =
                totalAmount > BigInt(0) ? (filledAmount * BigInt(100)) / totalAmount : BigInt(0);

            const percentageFilledNumber = Number(percentageFilled);
            const percentageFilledLabel = formatPercentage(
                Number(filledAmount),
                Number(totalAmount),
            );
            // TODO: Check if amount > MIN_FILL_SIZE
            const { data: isMatchable } = useBackOfQueueWallet({
                query: {
                    select: (data) =>
                        data.balances.some(
                            (balance) =>
                                balance.mint ===
                                    (row.original.data.side === "Buy"
                                        ? row.original.data.quote_mint
                                        : row.original.data.base_mint) &&
                                balance.amount > BigInt(0),
                        ),
                },
            });
            if (row.original.fills.length || row.original.state === OrderState.Cancelled) {
                return (
                    <div className="flex items-center justify-between gap-2">
                        {percentageFilledNumber ? (
                            <Progress value={percentageFilledNumber} />
                        ) : (
                            <></>
                        )}
                        <div className="ml-auto text-right text-sm">{percentageFilledLabel}</div>
                    </div>
                );
            } else if (isMatchable) {
                return (
                    <div className="whitespace-nowrap">
                        Finding counterparties
                        <AnimatedEllipsis />
                    </div>
                );
            }
        },
    },
    {
        id: "saved",
        accessorFn: (row) => {
            return row.fills.reduce((acc, fill) => acc + fill.amount, BigInt(0));
        },
        header: ({ column }) => {
            return (
                <div className="flex flex-row-reverse">
                    <Button
                        variant="ghost"
                        onClick={() => {
                            const isSorted = column.getIsSorted();
                            if (isSorted === "desc") {
                                column.toggleSorting(false);
                            } else if (isSorted === "asc") {
                                column.clearSorting();
                            } else {
                                column.toggleSorting(true);
                            }
                        }}
                    >
                        Est. Saved
                        {column.getIsSorted() === "asc" ? (
                            <ChevronUp className="ml-2 h-4 w-4" />
                        ) : column.getIsSorted() === "desc" ? (
                            <ChevronDown className="ml-2 h-4 w-4" />
                        ) : (
                            <ChevronsUpDown className="ml-2 h-4 w-4" />
                        )}
                    </Button>
                </div>
            );
        },
        cell: function Cell({ row }) {
            const { savings, savingsBps } = useSavingsAcrossFillsQuery(row.original);
            const formatted = savings > 0 ? formatCurrency(savings) : "--";
            return (
                <div className="pr-4 text-right">
                    {savings > 0 ? (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div>{formatted}</div>
                            </TooltipTrigger>
                            <TooltipContent>
                                {savingsBps ? `${Math.round(savingsBps)} bps` : "0 bps"}
                            </TooltipContent>
                        </Tooltip>
                    ) : (
                        formatted
                    )}
                </div>
            );
        },
    },
    {
        id: "timestamp",
        accessorKey: "created",
        header: ({ column }) => {
            return (
                <div className="flex flex-row-reverse">
                    <Button
                        variant="ghost"
                        onClick={() => {
                            const isSorted = column.getIsSorted();
                            if (isSorted === "desc") {
                                column.toggleSorting(false);
                            } else if (isSorted === "asc") {
                                column.clearSorting();
                            } else {
                                column.toggleSorting(true);
                            }
                        }}
                    >
                        Time
                        {column.getIsSorted() === "asc" ? (
                            <ChevronUp className="ml-2 h-4 w-4" />
                        ) : column.getIsSorted() === "desc" ? (
                            <ChevronDown className="ml-2 h-4 w-4" />
                        ) : (
                            <ChevronsUpDown className="ml-2 h-4 w-4" />
                        )}
                    </Button>
                </div>
            );
        },
        cell: ({ row }) => {
            const timestamp = row.getValue<bigint>("timestamp");
            const formatted = formatTimestamp(Number(timestamp));

            return <div className="whitespace-nowrap pr-4 text-right">{formatted}</div>;
        },
    },
    // {
    // id: "time to fill",
    // accessorFn: row => {
    //   return row.fills.reduce((acc, fill) => acc + fill.amount, BigInt(0))
    // },
    // header: () => {
    //   return <div>Time to fill</div>
    // },
    // // TODO: Add logic to calculate time to fill
    // cell: () => {
    //   return <div>{"2 min"}</div>
    // },
    // },
    // {
    //   id: 'actions',
    //   cell: ({ row }) => {
    //     const id = row.original.id

    //     return (
    //       <DropdownMenu>
    //         <DropdownMenuTrigger asChild>
    //           <Button variant="ghost" className="h-8 w-8 p-0">
    //             <span className="sr-only">Open menu</span>
    //             <MoreHorizontal className="h-4 w-4" />
    //           </Button>
    //         </DropdownMenuTrigger>
    //         <DropdownMenuContent align="end">
    //           <DropdownMenuLabel>Actions</DropdownMenuLabel>
    //           <DropdownMenuItem>Cancel Order</DropdownMenuItem>
    //           <DropdownMenuItem>Modify Order</DropdownMenuItem>
    //           <DropdownMenuItem onClick={() => navigator.clipboard.writeText(id)}>
    //             Copy Order ID
    //           </DropdownMenuItem>
    //           <DropdownMenuSeparator />
    //           <DropdownMenuItem>View order details</DropdownMenuItem>
    //         </DropdownMenuContent>
    //       </DropdownMenu>
    //     )
    //   },
    // },
];
