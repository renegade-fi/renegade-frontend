import type { ColumnDef, RowData } from "@tanstack/react-table";
import { ChevronDown, ChevronsUpDown, ChevronUp } from "lucide-react";
import { formatUnits } from "viem/utils";

import { TokenIcon } from "@/components/token-icon";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import type { AssetsTableRow } from "@/hooks/use-assets-table-data";
import { useChainName } from "@/hooks/use-chain-name";
import { useIsBase } from "@/hooks/use-is-base";
import { ASSETS_TABLE_BALANCE_COLUMN_TOOLTIP } from "@/lib/constants/tooltips";
import { formatCurrencyFromString, formatNumber } from "@/lib/format";
import { resolveAddress } from "@/lib/token";

declare module "@tanstack/react-table" {
    interface TableMeta<TData extends RowData> {
        isLongFormat: boolean;
    }
}

export const columns: ColumnDef<AssetsTableRow>[] = [
    {
        accessorKey: "mint",
        header: () => <div>Token</div>,
        cell: ({ row }) => {
            const mint = row.getValue<`0x${string}`>("mint");
            const token = resolveAddress(mint);
            return (
                <div className="flex items-center gap-2">
                    <TokenIcon size={20} ticker={token.ticker} />
                    {token.name}
                </div>
            );
        },
    },
    {
        id: "onChainUsdValue",
        accessorFn: (row) => row.onChainUsdValue,
        header: function Header({ column }) {
            const isBase = useIsBase();
            const chainName = useChainName(true /* short */);

            const buttonElement = (
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
                    {chainName} Balance ($)
                    {column.getIsSorted() === "asc" ? (
                        <ChevronUp className="ml-2 h-4 w-4" />
                    ) : column.getIsSorted() === "desc" ? (
                        <ChevronDown className="ml-2 h-4 w-4" />
                    ) : (
                        <ChevronsUpDown className="ml-2 h-4 w-4" />
                    )}
                </Button>
            );

            return (
                <div className="flex flex-row-reverse">
                    {isBase ? (
                        buttonElement
                    ) : (
                        <Tooltip>
                            <TooltipTrigger asChild>{buttonElement}</TooltipTrigger>
                            <TooltipContent>
                                {ASSETS_TABLE_BALANCE_COLUMN_TOOLTIP(chainName)}
                            </TooltipContent>
                        </Tooltip>
                    )}
                </div>
            );
        },
        cell: ({ row }) => {
            const value = row.getValue<string>("onChainUsdValue");
            const balance = row.original.rawOnChainBalance;
            const token = resolveAddress(row.original.mint);
            const formatted = formatNumber(balance, token.decimals);
            return (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="pr-4 text-right">{formatCurrencyFromString(value)}</div>
                    </TooltipTrigger>
                    <TooltipContent side="right">{`${formatted} ${token.ticker}`}</TooltipContent>
                </Tooltip>
            );
        },
    },
    {
        accessorKey: "onChainBalance",
        header: function Header() {
            const isBase = useIsBase();
            const chainName = useChainName(true /* short */);

            const headerElement = <div className="text-right">{chainName} Balance</div>;

            return isBase ? (
                headerElement
            ) : (
                <Tooltip>
                    <TooltipTrigger asChild>{headerElement}</TooltipTrigger>
                    <TooltipContent>
                        {ASSETS_TABLE_BALANCE_COLUMN_TOOLTIP(chainName)}
                    </TooltipContent>
                </Tooltip>
            );
        },
        cell: ({ row, table }) => {
            const balance = row.original.rawOnChainBalance;
            const token = resolveAddress(row.original.mint);
            const formatted = formatNumber(
                balance,
                token.decimals,
                table.options.meta?.isLongFormat,
            );
            const formattedLong = formatNumber(balance, token.decimals, true);
            const unformatted = formatUnits(balance, token.decimals);
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
        id: "renegadeUsdValue",
        accessorFn: (row) => row.renegadeUsdValue,
        header: ({ column }) => (
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
                    Renegade Balance ($)
                    {column.getIsSorted() === "asc" ? (
                        <ChevronUp className="ml-2 h-4 w-4" />
                    ) : column.getIsSorted() === "desc" ? (
                        <ChevronDown className="ml-2 h-4 w-4" />
                    ) : (
                        <ChevronsUpDown className="ml-2 h-4 w-4" />
                    )}
                </Button>
            </div>
        ),
        cell: ({ row }) => {
            const value = row.getValue<string>("renegadeUsdValue");
            const balance = row.original.rawRenegadeBalance;
            const token = resolveAddress(row.original.mint);
            const formatted = formatNumber(balance, token.decimals);
            return (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="pr-4 text-right">{formatCurrencyFromString(value)}</div>
                    </TooltipTrigger>
                    <TooltipContent side="right">{`${formatted} ${token.ticker}`}</TooltipContent>
                </Tooltip>
            );
        },
    },
    {
        accessorKey: "renegadeBalance",
        header: () => <div className="text-right">Renegade Balance</div>,
        cell: ({ row, table }) => {
            const balance = row.original.rawRenegadeBalance;
            const token = resolveAddress(row.original.mint);
            const formatted = formatNumber(
                balance,
                token.decimals,
                table.options.meta?.isLongFormat,
            );
            const formattedLong = formatNumber(balance, token.decimals, true);
            const unformatted = formatUnits(balance, token.decimals);
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
];
