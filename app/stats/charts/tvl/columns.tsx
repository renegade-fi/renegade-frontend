import type { ColumnDef } from "@tanstack/react-table";
import { ChevronDown, ChevronsUpDown, ChevronUp } from "lucide-react";

import { TokenIcon } from "@/components/token-icon";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { formatCurrency, formatNumber } from "@/lib/format";
import { resolveTicker } from "@/lib/token";

type TvlRow = {
    /** The ticker of the token */
    ticker: string;
    /** Non-decimal corrected amount of TVL on Base */
    baseTvl: bigint;
    /** Non-decimal corrected amount of TVL on Arbitrum */
    arbitrumTvl: bigint;
    /** The TVL in USD on Base */
    baseTvlUsd: number;
    /** The TVL in USD on Arbitrum */
    arbitrumTvlUsd: number;
    /** The TVL in USD on Base and Arbitrum */
    totalTvl: bigint;
    /** The TVL in USD on Base and Arbitrum */
    totalTvlUsd: number;
};

export const columns: ColumnDef<TvlRow>[] = [
    {
        accessorKey: "ticker",
        header: () => <div className="pr-7">Asset</div>,
        cell: ({ row }) => {
            const ticker = row.getValue<string>("ticker");
            return (
                <div className="flex items-center gap-2 font-medium">
                    <TokenIcon size={20} ticker={ticker} />
                    {ticker}
                </div>
            );
        },
    },
    {
        accessorKey: "baseTvlUsd",
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
                        Base
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
            const ticker = row.getValue<string>("ticker");
            const token = resolveTicker(ticker);
            const amount = row.original.baseTvl;
            const formattedUsd = formatCurrency(row.original.baseTvlUsd);
            const formattedAmount = formatNumber(amount, token.decimals);
            if (!amount) {
                return <div className="pr-4 text-right">--</div>;
            }
            return (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="pr-4 text-right">{formattedUsd}</div>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                        {`${formattedAmount} ${token.ticker}`}
                    </TooltipContent>
                </Tooltip>
            );
        },
    },
    {
        accessorKey: "arbitrumTvlUsd",
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
                        Arbitrum
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
            const ticker = row.getValue<string>("ticker");
            const token = resolveTicker(ticker);
            const amount = row.original.arbitrumTvl;
            const formattedUsd = formatCurrency(row.original.arbitrumTvlUsd);
            const formattedAmount = formatNumber(amount, token.decimals);
            if (!amount) {
                return <div className="pr-4 text-right">--</div>;
            }
            return (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="pr-4 text-right">{formattedUsd}</div>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                        {`${formattedAmount} ${token.ticker}`}
                    </TooltipContent>
                </Tooltip>
            );
        },
    },
    {
        accessorKey: "totalTvlUsd",
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
                        Total
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
            const ticker = row.getValue<string>("ticker");
            const token = resolveTicker(ticker);
            const amount = row.original.totalTvl;
            const formattedUsd = formatCurrency(row.original.totalTvlUsd);
            const formattedAmount = formatNumber(amount, token.decimals);
            return (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="pr-4 text-right">{formattedUsd}</div>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                        {`${formattedAmount} ${token.ticker}`}
                    </TooltipContent>
                </Tooltip>
            );
        },
    },
];
