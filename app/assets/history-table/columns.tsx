import type { ColumnDef } from "@tanstack/react-table";
import { formatUnits } from "viem/utils";

import type { HistoryData } from "@/app/assets/page-client";

import { TokenIcon } from "@/components/token-icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { usePriceQuery } from "@/hooks/use-price-query";
import { amountTimesPrice } from "@/hooks/use-usd-price";
import { formatCurrencyFromString, formatNumber, formatTimestamp } from "@/lib/format";
import { resolveAddress } from "@/lib/token";

export const columns: ColumnDef<HistoryData>[] = [
    {
        accessorKey: "status",
        cell: ({ row }) => {
            const status = row.getValue<`0x${string}`>("status");
            return <div>{status}</div>;
        },
        header: () => <div>Status</div>,
    },
    {
        accessorKey: "mint",
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
        header: () => <div className="pr-7">Asset</div>,
    },
    {
        accessorKey: "isWithdrawal",
        cell: ({ row }) => {
            const isWithdrawal = row.getValue<boolean>("isWithdrawal");
            return <div>{isWithdrawal}</div>;
        },
        header: () => <div>Type</div>,
        id: "isWithdrawal",
    },
    {
        cell: function Cell({ row }) {
            const mint = row.getValue<`0x${string}`>("mint");
            const token = resolveAddress(mint);
            const { data: price } = usePriceQuery(mint);
            const amount = row.original.rawAmount;
            const usdValueBigInt = amountTimesPrice(amount, price);
            const usdValue = formatUnits(usdValueBigInt, token.decimals);
            return <div className="text-right">{formatCurrencyFromString(usdValue)}</div>;
        },
        header: () => <div className="whitespace-nowrap text-right">Amount ($)</div>,
        id: "usdValue",
    },
    {
        accessorKey: "amount",
        cell: ({ row, table }) => {
            const amount = row.original.rawAmount;
            const token = resolveAddress(row.original.mint);
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
                        <div className="text-right">{formatted}</div>
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={15}>
                        {`${table.options.meta?.isLongFormat ? unformatted : formattedLong} ${token.ticker}`}
                    </TooltipContent>
                </Tooltip>
            );
        },
        header: () => <div className="text-right">Amount</div>,
    },
    {
        accessorKey: "timestamp",
        cell: ({ row }) => {
            const timestamp = row.getValue<number>("timestamp");
            const formatted = formatTimestamp(timestamp);
            return <div className="whitespace-nowrap text-right">{formatted}</div>;
        },
        header: () => <div className="text-right">Time</div>,
    },
];
