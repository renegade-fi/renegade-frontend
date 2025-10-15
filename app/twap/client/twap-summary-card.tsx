"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

    const localStartDisplay = start.toLocaleString(undefined, {
        day: "2-digit",
        hour: "2-digit",
        hour12: true,
        minute: "2-digit",
        month: "short",
        year: "numeric",
    });

    return (
        <Card className="flex-1">
            <CardHeader>
                <CardDescription>Simulated TWAP</CardDescription>
                <CardTitle className="text-2xl font-semibold">
                    {request.direction} {request.receiveTicker}
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 text-sm">
                {/* Request details */}
                <div className="w-full flex justify-between text-muted-foreground">
                    <span>Total {summary.soldTicker} sold</span>
                    <span className="tabular-nums">{summary.cumulativeSold.toFixed(4)}</span>
                </div>
                <div className="w-full flex justify-between text-muted-foreground">
                    <span>Number of clips</span>
                    <span className="tabular-nums">{request.numTrades}</span>
                </div>
                <div className="w-full flex justify-between text-muted-foreground">
                    <span>Start</span>
                    <span>{localStartDisplay}</span>
                </div>
                <div className="w-full flex justify-between text-muted-foreground">
                    <span>Duration</span>
                    <span>
                        <span className="tabular-nums">{hours}</span>h{" "}
                        <span className="tabular-nums">{minutes}</span>m
                    </span>
                </div>

                {/* Totals */}
                <div className="w-full flex justify-between text-muted-foreground">
                    <span>Renegade fee</span>
                    <span>
                        <span className="tabular-nums">{summary.renegadeFeeBps.toFixed(1)}</span>{" "}
                        bps
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}
