"use client";
import dynamic from "next/dynamic";
import numeral from "numeral";
import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import type { TwapPriceTableData } from "../actions/get-price-table-data";
import { formatUSDC } from "../lib/utils";

interface ExecutionResultsTableProps {
    data: TwapPriceTableData;
}

function formatReceiveAmount(amount: number, ticker: string): string {
    if (ticker === "USDC") {
        return formatUSDC(amount);
    }
    return `${numeral(amount).format("0,0[.]0000")} ${ticker}`;
}

export function ExecutionResultsTableInner({ data }: ExecutionResultsTableProps) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead />
                    <TableHead className="text-right">Binance TWAP</TableHead>
                    <TableHead className="text-right">Renegade Mid Cross</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                <TableRow>
                    <TableCell className="text-muted-foreground">Average Price</TableCell>
                    <TableCell className="text-right tabular-nums">
                        {formatUSDC(data.averagePriceBinance)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                        {formatUSDC(data.averagePriceRenegade)}
                    </TableCell>
                </TableRow>
                <TableRow>
                    <TableCell className="text-muted-foreground">Total Received</TableCell>
                    <TableCell className="text-right tabular-nums">
                        {formatReceiveAmount(data.cumulativeBinanceReceived, data.receivedTicker)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                        {formatReceiveAmount(data.cumulativeRenegadeReceived, data.receivedTicker)}
                    </TableCell>
                </TableRow>
            </TableBody>
            <TableFooter>
                <TableRow>
                    <TableCell className="text-muted-foreground">Price Improvement</TableCell>
                    <TableCell className="text-right" />
                    <TableCell className="text-right tabular-nums text-green-price">
                        {numeral(data.cumulativeDeltaBps).format("0,0.[00]")} bps
                    </TableCell>
                </TableRow>
                <TableRow className="border-t">
                    <TableCell className="text-muted-foreground">Routed through Renegade</TableCell>
                    <TableCell className="text-right" />
                    <TableCell className="text-right tabular-nums text-green-price">
                        {data.renegadeFillPercent !== undefined
                            ? `${formatUSDC(data.renegadeFillPercent * 100)}%`
                            : "N/A"}
                    </TableCell>
                </TableRow>
            </TableFooter>
        </Table>
    );
}

const ExecutionResultsTableLazy = dynamic(
    () =>
        import("./twap-price-table").then((mod) => ({
            default: mod.ExecutionResultsTableInner,
        })),
    {
        loading: () => (
            <div className="p-6 text-sm text-muted-foreground">Loading price comparison...</div>
        ),
        ssr: false,
    },
);

export function ExecutionResultsTableClient({ data }: ExecutionResultsTableProps) {
    return <ExecutionResultsTableLazy data={data} />;
}
