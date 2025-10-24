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
import type { ExecutionResults } from "../actions/get-execution-results";
import { formatUSDC } from "../lib/utils";
import { ChartSkeleton } from "./chart-skeleton";

interface ExecutionResultsTableProps {
    data: ExecutionResults;
}

function formatReceiveAmount(amount: number, ticker: string): string {
    if (ticker === "USDC") {
        return formatUSDC(amount);
    }
    return `${numeral(amount).format("0,0[.]0000")} ${ticker}`;
}

export function ExecutionResultsTableInner({ data }: ExecutionResultsTableProps) {
    const {
        averagePriceBinance,
        averagePriceRenegade,
        cumulativeBinanceReceived,
        cumulativeDeltaBps,
        cumulativeRenegadeReceived,
        receivedTicker,
        renegadeFillPercent,
    } = data;
    return (
        <div className="border flex-1 self-start">
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
                            {formatUSDC(averagePriceBinance)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                            {formatUSDC(averagePriceRenegade)}
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell className="text-muted-foreground">Total Received</TableCell>
                        <TableCell className="text-right tabular-nums">
                            {formatReceiveAmount(cumulativeBinanceReceived, receivedTicker)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                            {formatReceiveAmount(cumulativeRenegadeReceived, receivedTicker)}
                        </TableCell>
                    </TableRow>
                </TableBody>
                <TableFooter>
                    <TableRow>
                        <TableCell className="text-muted-foreground">Price Improvement</TableCell>
                        <TableCell className="text-right" />
                        <TableCell
                            className={`text-right tabular-nums ${cumulativeDeltaBps > 0 ? "text-green-price" : ""}`}
                        >
                            {numeral(cumulativeDeltaBps).format("0,0.[00]")} bps
                        </TableCell>
                    </TableRow>
                    <TableRow className="border-t">
                        <TableCell className="text-muted-foreground">
                            Routed through Renegade
                        </TableCell>
                        <TableCell className="text-right" />
                        <TableCell className="text-right tabular-nums text-green-price">
                            {renegadeFillPercent !== undefined
                                ? `${formatUSDC(renegadeFillPercent * 100)}%`
                                : "N/A"}
                        </TableCell>
                    </TableRow>
                </TableFooter>
            </Table>
        </div>
    );
}

const ExecutionResultsTableLazy = dynamic(
    () =>
        import("./execution-results-table").then((mod) => ({
            default: mod.ExecutionResultsTableInner,
        })),
    {
        loading: () => (
            <div className="border aspect-video  w-full">
                <ChartSkeleton />
            </div>
        ),
        ssr: false,
    },
);

export function ExecutionResultsTableClient({ data }: ExecutionResultsTableProps) {
    return <ExecutionResultsTableLazy data={data} />;
}
