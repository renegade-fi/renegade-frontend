"use client";

import { Table, TableBody, TableCell, TableFooter, TableRow } from "@/components/ui/table";
import { calculateDuration } from "../lib/date-utils";

interface TwapSummaryProps {
    summary: {
        cumulativeDeltaBps: number;
        renegadeFeeBps: number;
        binanceFeeBps: number;
        cumulativeSold: number;
        soldTicker: string;
        cumulativeRenegadeReceived: number;
        cumulativeBinanceReceived: number;
        receivedTicker: string;
        averagePriceBinance: number;
        averagePriceRenegade: number;
    } | null;
    request: {
        numTrades: number;
        startTime: string; // ISO
        endTime: string; // ISO
        direction: "Buy" | "Sell";
        sendTicker: string;
        receiveTicker: string;
    } | null;
}

export function TwapSummaryCard({ summary, request }: TwapSummaryProps) {
    if (!summary || !request) return null;

    const start = new Date(request.startTime);
    const end = new Date(request.endTime);
    const { hours, minutes } = calculateDuration(start, end);

    const localStartDisplay = `${start.getMonth() + 1}/${start.getDate()}/${start.getFullYear()} - ${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}:${String(start.getSeconds()).padStart(2, '0')}`;

    return (
        <div className="flex-1 flex flex-col gap-4">
            <div className="border rounded-lg">
                <Table>
                    <TableBody>
                        <TableRow>
                            <TableCell className="text-muted-foreground">Total {summary.soldTicker} sent</TableCell>
                            <TableCell className="text-right tabular-nums">{summary.cumulativeSold.toFixed(4)} {summary.soldTicker}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className="text-muted-foreground">Binance with Renegade received</TableCell>
                            <TableCell className="text-right tabular-nums">
                                {summary.cumulativeRenegadeReceived.toFixed(4)} {summary.receivedTicker}
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className="text-muted-foreground">Binance only received</TableCell>
                            <TableCell className="text-right tabular-nums">
                                {summary.cumulativeBinanceReceived.toFixed(4)} {summary.receivedTicker}
                            </TableCell>
                        </TableRow>
                    </TableBody>
                    <TableFooter>
                        <TableRow>
                            <TableCell>Price improvement</TableCell>
                            <TableCell className="text-green-price text-right">
                                <span className="tabular-nums">{summary.cumulativeDeltaBps.toFixed(2)}</span>{" "}
                                bps
                            </TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
            </div>

            <div className="border rounded-lg">
                <Table>
                    <TableBody>
                        <TableRow>
                            <TableCell className="text-muted-foreground">Executed Size</TableCell>
                            <TableCell className="text-right tabular-nums">{summary.cumulativeSold.toFixed(4)} {summary.soldTicker}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className="text-muted-foreground">Average Price (Binance only)</TableCell>
                            <TableCell className="text-right tabular-nums">
                                {summary.averagePriceBinance.toFixed(4)} 
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className="text-muted-foreground">Average Price (with Renegade)</TableCell>
                            <TableCell className="text-right tabular-nums">
                                {summary.averagePriceRenegade.toFixed(4)} 
                            </TableCell>
                        </TableRow>
                    </TableBody>
                    <TableFooter>
                        <TableRow>
                            <TableCell>Price improvement</TableCell>
                            <TableCell className="text-green-price text-right">
                                <span className="tabular-nums">{summary.cumulativeDeltaBps.toFixed(2)}</span>{" "}
                                bps
                            </TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
            </div>

            <div className="border rounded-lg">
                <Table>
                    <TableBody>
                        <TableRow>
                            <TableCell className="text-muted-foreground">Time</TableCell>
                            <TableCell className="text-right">{localStartDisplay}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className="text-muted-foreground">Runtime</TableCell>
                            <TableCell className="text-right">
                                <span className="tabular-nums">{hours}</span>h{" "}
                                <span className="tabular-nums">{minutes}</span>m
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className="text-muted-foreground">Number of clips</TableCell>
                            <TableCell className="text-right tabular-nums">{request.numTrades} clips</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className="text-muted-foreground">Renegade fee</TableCell>
                            <TableCell className="text-right">
                                <span className="tabular-nums">{summary.renegadeFeeBps.toFixed(1)}</span>{" "}
                                bps
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
