"use client";

import type { ChainId } from "@renegade-fi/react/constants";
import { Token } from "@renegade-fi/token-nextjs";
import { TriangleAlert } from "lucide-react";
import * as React from "react";
import { Bar, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts";
import type z from "zod";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ChartConfig } from "@/components/ui/chart";
import {
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from "@/components/ui/empty";
import { formatNumber } from "@/lib/format";
import { findTokenByAddress } from "../lib/token-utils";
import type { SimulateTwapResponseSchema } from "../lib/twap-server-client/api-types/request-response";
import type { TwapTradeResult } from "../lib/twap-server-client/api-types/twap";
import { convertDecimalToRaw, formatUnitsToNumber } from "../lib/utils";

export function TwapChart({
    simData,
    baseMint,
    error,
}: {
    simData: z.output<typeof SimulateTwapResponseSchema> | null;
    baseMint: string | undefined;
    error?: string;
}) {
    const baseToken = React.useMemo(() => findTokenByAddress(baseMint), [baseMint]);
    const quoteToken = React.useMemo(
        () => (baseToken ? Token.fromTickerOnChain("USDC", baseToken.chain as ChainId) : undefined),
        [baseToken],
    );

    // Get quote token and direction from first trade (all trades should have same direction and quote_mint)
    const firstTrade = simData?.strategies[0]?.sim_result?.trades[0];
    const direction = firstTrade?.direction;

    if (error) {
        return (
            <Empty>
                <EmptyHeader>
                    <EmptyMedia variant="icon">
                        <TriangleAlert />
                    </EmptyMedia>
                    <EmptyTitle>Simulation Error</EmptyTitle>
                    <EmptyDescription>{error}</EmptyDescription>
                </EmptyHeader>
            </Empty>
        );
    }

    if (!simData || !baseMint) {
        return (
            <Empty>
                <EmptyDescription>Run a simulation to see the results...</EmptyDescription>
            </Empty>
        );
    }

    // --- Validation --- //

    if (!baseToken) {
        return <div className="text-sm text-muted-foreground pl-6">Invalid base mint.</div>;
    } else if (!quoteToken) {
        return <div className="text-sm text-muted-foreground pl-6">Invalid quote token.</div>;
    } else if (!direction) {
        return <div className="text-sm text-muted-foreground pl-6">Invalid direction.</div>;
    }

    // --- Data --- //

    const renegade = simData.strategies.find((s) => s.strategy === "Renegade");
    const binance = simData.strategies.find((s) => s.strategy === "Binance");
    if (!renegade || !binance) {
        return <div className="text-sm text-muted-foreground">No data to display.</div>;
    }

    // Build the chart data
    type ChartPoint = { time: string; renegade: number; binance: number; delta: number };

    // Determine receive token and decimals based on direction
    const receiveToken = direction === "Buy" ? baseToken : quoteToken;
    const receiveDecimals = receiveToken.decimals;
    const rawData = mergeSeries(
        computeSeries(renegade.sim_result.trades, receiveDecimals, direction),
        computeSeries(binance.sim_result.trades, receiveDecimals, direction),
    );

    // Derive delta series (bps) for visualization on right axis
    const chartData: ChartPoint[] = rawData.map((d) => {
        const delta = ((d.renegade - d.binance) / d.binance) * 10000;
        return { ...d, delta };
    });

    // --- Chart Config --- //

    const chartConfig = {
        binance: {
            color: "#f4d150",
            label: "Binance",
        },
        delta: {
            color: "#f59e0b",
            label: "Delta (bps)",
        },
        renegade: {
            color: "#60a5fa",
            label: "Renegade",
        },
    } satisfies ChartConfig;

    const [minY, maxY] = computeYDomain(chartData);
    const [minDelta, maxDelta] = computeDeltaDomain(chartData);

    // Calculate cumulative savings from simulation summaries
    const renegadeReceiveAmount =
        direction === "Buy"
            ? renegade.summary.total_base_amount
            : renegade.summary.total_quote_amount;
    const binanceReceiveAmount =
        direction === "Buy"
            ? binance.summary.total_base_amount
            : binance.summary.total_quote_amount;

    const renegadeReceive = formatUnitsToNumber(renegadeReceiveAmount, receiveDecimals);
    const binanceReceive = formatUnitsToNumber(binanceReceiveAmount, receiveDecimals);
    const cumDeltaBps = ((renegadeReceive - binanceReceive) / binanceReceive) * 10000;

    // Fees provided as decimal fractions; convert to bps for display
    const renegadeFeeBps = Number(renegade.summary.fee) * 10000;
    const binanceFeeBps = Number(binance.summary.fee) * 10000;

    const tooltipFormatter = (value: number | string, name: string) => {
        if (name === "Delta (bps)" || name === "delta") {
            return <span className="font-mono">{formatBps(Number(value))}</span>;
        }

        const valueNumber = Number(value);
        const valueBigInt = convertDecimalToRaw(valueNumber, receiveToken.decimals);
        return (
            <span className="font-mono">
                {formatNumber(valueBigInt, receiveToken.decimals)} {receiveToken.ticker}
            </span>
        );
    };

    // --- Render --- //

    return (
        <>
            <CardHeader className="py-3">
                <div className="flex items-center justify-between gap-4">
                    <CardTitle>TWAP Chart</CardTitle>
                    <div className="flex items-center gap-6">
                        <CardTitle className="flex items-baseline gap-2">
                            <span>Cumulative Savings:</span>
                            <span
                                className={`font-bold font-mono ${
                                    cumDeltaBps >= 0 ? "text-green-500" : "text-red-500"
                                }`}
                            >
                                {cumDeltaBps.toFixed(2)} bps
                            </span>
                        </CardTitle>
                    </div>
                </div>
                <div className="flex justify-end mt-1">
                    <div className="text-sm text-muted-foreground">
                        <span className="mr-4">
                            Binance fee:{" "}
                            <span className="font-mono">{binanceFeeBps.toFixed(1)} bps</span>
                        </span>
                        <span>
                            Renegade fee:{" "}
                            <span className="font-mono">{renegadeFeeBps.toFixed(1)} bps</span>
                        </span>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig}>
                    <ComposedChart
                        accessibilityLayer
                        data={chartData}
                        margin={{ bottom: 25, left: 12, right: 12, top: 24 }}
                    >
                        <CartesianGrid vertical={false} />
                        <YAxis
                            axisLine={false}
                            domain={[minY, maxY]}
                            padding={{ bottom: 8, top: 0 }}
                            tickFormatter={(v) => {
                                const formatted = Number(v).toFixed(4);
                                return `${formatted} ${receiveToken.ticker}`;
                            }}
                            tickLine={false}
                            tickMargin={8}
                        />
                        <XAxis
                            axisLine={false}
                            dataKey="time"
                            tickFormatter={(value) => formatTick(value)}
                            tickLine={false}
                            tickMargin={8}
                        />
                        <ChartTooltip
                            content={
                                <ChartTooltipContent
                                    formatter={tooltipFormatter as any}
                                    hideLabel
                                />
                            }
                            cursor={false}
                        />
                        <YAxis
                            axisLine={false}
                            domain={[minDelta, maxDelta]}
                            orientation="right"
                            padding={{ bottom: 8, top: 0 }}
                            tickFormatter={(v) => formatBps(v)}
                            tickLine={false}
                            tickMargin={8}
                            yAxisId="right"
                        />
                        {/* Grouped bars for fills */}
                        <Bar
                            barSize={14}
                            dataKey="renegade"
                            fill="var(--color-renegade)"
                            radius={[2, 2, 0, 0]}
                        />
                        <Bar
                            barSize={14}
                            dataKey="binance"
                            fill="var(--color-binance)"
                            radius={[2, 2, 0, 0]}
                        />
                        {/* Delta line on right axis */}
                        <Line
                            dataKey="delta"
                            dot={false}
                            stroke="var(--color-delta)"
                            strokeWidth={2}
                            type="linear"
                            yAxisId="right"
                        />
                        <ChartLegend content={<ChartLegendContent />} />
                    </ComposedChart>
                </ChartContainer>
            </CardContent>
        </>
    );
}

// -----------
// | Helpers |
// -----------

// --- Series Computation --- //

function computeSeries(
    trades: TwapTradeResult[],
    receiveDecimals: number,
    direction: "Buy" | "Sell",
) {
    const sorted = [...trades].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );

    return sorted.map((t) => {
        // For Buy: we receive base_amount (base token)
        // For Sell: we receive quote_amount (quote token)
        const receiveAmount = direction === "Buy" ? t.base_amount : t.quote_amount;
        return {
            time: t.timestamp,
            value: Math.abs(formatUnitsToNumber(receiveAmount, receiveDecimals)),
        };
    });
}

function mergeSeries(
    renegade: { time: string; value: number }[],
    binance: { time: string; value: number }[],
): { time: string; renegade: number; binance: number }[] {
    const map = new Map<string, { time: string; renegade?: number; binance?: number }>();
    for (const p of renegade) {
        const existing = map.get(p.time) || { time: p.time };
        existing.renegade = p.value;
        map.set(p.time, existing);
    }
    for (const p of binance) {
        const existing = map.get(p.time) || { time: p.time };
        existing.binance = p.value;
        map.set(p.time, existing);
    }
    return Array.from(map.values())
        .filter((d) => d.renegade !== undefined && d.binance !== undefined)
        .map((d) => ({
            binance: d.binance as number,
            renegade: d.renegade as number,
            time: d.time,
        }))
        .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
}

// --- Axes Computation --- //

function computeYDomain(data: Array<{ renegade: number; binance: number }>): [number, number] {
    if (!data.length) return [0, 1];
    let min = Infinity;
    let max = -Infinity;
    for (const d of data) {
        min = Math.min(min, d.renegade, d.binance);
        max = Math.max(max, d.renegade, d.binance);
    }
    if (!Number.isFinite(min) || !Number.isFinite(max)) return [0, 1];

    // Pad domain slightly and clamp if identical
    if (min === max) {
        const pad = max === 0 ? 1 : Math.abs(max) * 0.01;
        return [min - pad, max + pad];
    }
    const span = max - min;
    const pad = span * 0.05; // 5% headroom
    return [min - pad, max + pad];
}

function computeDeltaDomain(data: Array<{ delta: number }>): [number, number] {
    if (!data.length) return [0, 1];
    let min = Infinity;
    let max = -Infinity;
    for (const d of data) {
        min = Math.min(min, d.delta);
        max = Math.max(max, d.delta);
    }
    if (!Number.isFinite(min) || !Number.isFinite(max)) return [0, 1];

    // Use actual min/max with small padding instead of symmetric bounds
    const range = max - min;
    const pad = Math.max(range * 0.1, 0.5); // At least 0.5 bps padding, or 10% of range
    return [min - pad, max + pad];
}

// --- Formatting --- //

function formatTick(value: string) {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatBps(v: number): string {
    if (!Number.isFinite(v)) return "-";

    const sign = v >= 0 ? "+" : "";
    return `${sign}${v.toFixed(2)} bps`;
}
