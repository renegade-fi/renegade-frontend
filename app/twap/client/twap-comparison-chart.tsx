"use client";

import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    type ChartConfig,
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";

interface TwapComparisonChartProps {
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
}

const chartConfig = {
    binanceOnly: {
        color: "hsl(var(--chart-yellow))",
        label: "Binance only",
    },
    binanceWithRenegade: {
        color: "hsl(var(--chart-blue))",
        label: "Binance with Renegade",
    },
} satisfies ChartConfig;

export function TwapComparisonChart({ summary }: TwapComparisonChartProps) {
    if (!summary) return null;

    const chartData = [
        {
            binanceOnly: summary.cumulativeBinanceReceived,
            binanceWithRenegade: summary.cumulativeRenegadeReceived,
            category: "Received",
        },
    ];

    // Calculate tight domain to zoom in on the BPS difference
    const minValue = Math.min(
        summary.cumulativeRenegadeReceived,
        summary.cumulativeBinanceReceived,
    );
    const maxValue = Math.max(
        summary.cumulativeRenegadeReceived,
        summary.cumulativeBinanceReceived,
    );
    const range = maxValue - minValue;
    const padding = range * 0.5; // Add 50% padding above and below for visibility
    const yMin = minValue - padding;
    const yMax = maxValue + padding;

    return (
        <Card className="flex-1">
            <CardHeader>
                <CardDescription>Total {summary.receivedTicker} received</CardDescription>
                <CardTitle className="text-2xl font-semibold">
                    Price improvement: {summary.cumulativeDeltaBps.toFixed(2)} bps
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ChartContainer className="h-[200px] w-full" config={chartConfig}>
                    <BarChart
                        accessibilityLayer
                        data={chartData}
                        margin={{
                            top: 20,
                        }}
                    >
                        <CartesianGrid vertical={false} />
                        <XAxis
                            axisLine={false}
                            dataKey="category"
                            hide
                            tickLine={false}
                            tickMargin={10}
                        />
                        <YAxis domain={[yMin, yMax]} hide />
                        <ChartTooltip content={<ChartTooltipContent />} cursor={false} />
                        <ChartLegend content={<ChartLegendContent />} />
                        <Bar
                            dataKey="binanceWithRenegade"
                            fill={`var(--color-binanceWithRenegade)`}
                            radius={8}
                        >
                            <LabelList
                                className="fill-foreground"
                                fontSize={12}
                                formatter={(value: number) =>
                                    `${value.toFixed(4)} ${summary.receivedTicker}`
                                }
                                offset={12}
                                position="top"
                            />
                        </Bar>
                        <Bar dataKey="binanceOnly" fill={`var(--color-binanceOnly)`} radius={8}>
                            <LabelList
                                className="fill-foreground"
                                fontSize={12}
                                formatter={(value: number) =>
                                    `${value.toFixed(4)} ${summary.receivedTicker}`
                                }
                                offset={12}
                                position="top"
                            />
                        </Bar>
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
