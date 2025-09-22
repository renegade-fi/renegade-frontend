import type { ColumnDef } from "@tanstack/react-table";
import { ChevronDown, ChevronsUpDown, ChevronUp } from "lucide-react";
import { arbitrum, base } from "viem/chains";

import type { BalanceData } from "@/app/stats/actions/types";
import { TokenIcon } from "@/components/token-icon";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { formatCurrency, formatNumber } from "@/lib/format";
import { resolveTicker } from "@/lib/token";

// Function to get column visibility state based on selected chain ID
export function getColumnVisibility(selectedChainId: number): Record<string, boolean> {
    if (selectedChainId === 0) {
        // Show all columns when "All Chains" is selected
        return {
            arbitrumUsd: true,
            baseUsd: true,
            ticker: true,
            totalUsd: true,
        };
    }

    // Show only Asset, selected chain, and Total columns
    const visibility: Record<string, boolean> = {
        arbitrumUsd: selectedChainId === arbitrum.id,
        baseUsd: selectedChainId === base.id,
        ticker: true, // Always show Asset column
        totalUsd: true, // Always show Total column
    };

    return visibility;
}

export const columns: ColumnDef<BalanceData>[] = [
    {
        accessorKey: "ticker",
        cell: ({ row }) => {
            const ticker = row.getValue<string>("ticker");
            return (
                <div className="flex items-center gap-2 font-medium">
                    <TokenIcon size={20} ticker={ticker} />
                    {ticker}
                </div>
            );
        },
        header: () => <div className="pr-7">Asset</div>,
    },
    {
        accessorKey: "baseUsd",
        cell: ({ row }) => {
            const ticker = row.getValue<string>("ticker");
            const token = resolveTicker(ticker);
            const value = row.getValue<number>("baseUsd");
            const amount = row.original.baseAmount;
            const isZero = value === 0;
            const formattedAmount = formatNumber(amount, token.decimals);

            return (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className={`pr-4 text-right ${isZero ? "text-muted" : ""}`}>
                            {formatCurrency(value)}
                        </div>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                        {`${formattedAmount} ${token.ticker}`}
                    </TooltipContent>
                </Tooltip>
            );
        },
        header: ({ column }) => {
            return (
                <div className="flex flex-row-reverse">
                    <Button
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
                        variant="ghost"
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
    },
    {
        accessorKey: "arbitrumUsd",
        cell: ({ row }) => {
            const ticker = row.getValue<string>("ticker");
            const token = resolveTicker(ticker);
            const value = row.getValue<number>("arbitrumUsd");
            const amount = row.original.arbitrumAmount;
            const isZero = value === 0;
            const formattedAmount = formatNumber(amount, token.decimals);

            return (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className={`pr-4 text-right ${isZero ? "text-muted" : ""}`}>
                            {formatCurrency(value)}
                        </div>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                        {`${formattedAmount} ${token.ticker}`}
                    </TooltipContent>
                </Tooltip>
            );
        },
        header: ({ column }) => {
            return (
                <div className="flex flex-row-reverse">
                    <Button
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
                        variant="ghost"
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
    },
    {
        accessorKey: "totalUsd",
        cell: ({ row }) => {
            const ticker = row.getValue<string>("ticker");
            const token = resolveTicker(ticker);
            const value = row.getValue<number>("totalUsd");
            const amount = row.original.totalAmount;
            const isZero = value === 0;
            const formattedAmount = formatNumber(amount, token.decimals);

            return (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div
                            className={`pr-4 text-right font-medium ${isZero ? "text-muted" : ""}`}
                        >
                            {formatCurrency(value)}
                        </div>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                        {`${formattedAmount} ${token.ticker}`}
                    </TooltipContent>
                </Tooltip>
            );
        },
        header: ({ column }) => {
            return (
                <div className="flex flex-row-reverse">
                    <Button
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
                        variant="ghost"
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
    },
];
