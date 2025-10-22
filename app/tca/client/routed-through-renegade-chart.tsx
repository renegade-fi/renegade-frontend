"use client";

import dynamic from "next/dynamic";
import type * as React from "react";
import { Label, Pie, PieChart } from "recharts";
import { GlyphLoadingIndicator } from "@/components/glyph-loading-indicator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    type ChartConfig,
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";
import type { TwapInfoTableData } from "../actions/get-info-table-data";
import { formatUSDC } from "../lib/utils";

interface RoutedRenegadeChartProps {
    data: TwapInfoTableData;
}

const chartConfig = {
    binanceFill: {
        color: "hsl(var(--chart-yellow))",
        label: "Binance",
    },
    renegadeFill: {
        color: "hsl(var(--chart-blue))",
        label: "Renegade",
    },
} satisfies ChartConfig;

export function RoutedRenegadeChartInner({ data }: RoutedRenegadeChartProps) {
    const { totalSize, renegadeFillPercent } = data;

    const header = (
        <CardHeader>
            <CardTitle>Routed through Renegade</CardTitle>
            <CardDescription>
                The Renegade Mid Cross fills as much liquidity as possible at the Binance midpoint
                before sweeping Binance itself for the remainder.
            </CardDescription>
        </CardHeader>
    );

    // Only render if we have the fill percentage data
    if (renegadeFillPercent === undefined) {
        return (
            <Card>
                {header}
                <CardContent className="flex min-h-[400px] items-center justify-center text-sm text-muted-foreground">
                    Renegade data is not available for the selected parameters.
                </CardContent>
            </Card>
        );
    }

    const renegadeFillAmount = totalSize * renegadeFillPercent;
    const binanceFillAmount = totalSize * (1 - renegadeFillPercent);

    const chartData = [
        {
            fill: "var(--color-renegadeFill)",
            fillType: "renegadeFill",
            value: renegadeFillAmount,
        },
        {
            fill: "var(--color-binanceFill)",
            fillType: "binanceFill",
            value: binanceFillAmount,
        },
    ];

    const percentageDisplay = `${formatUSDC(renegadeFillPercent * 100)}%`;

    return (
        <Card>
            {header}
            <CardContent>
                <ChartContainer config={chartConfig}>
                    <PieChart>
                        <ChartTooltip
                            content={
                                <ChartTooltipContent
                                    formatter={(value, name) => {
                                        const formattedValue = formatUSDC(Number(value));
                                        return (
                                            <>
                                                <div
                                                    className="h-2.5 w-2.5 shrink-0 rounded-[2px] bg-[--color-bg]"
                                                    style={
                                                        {
                                                            "--color-bg": `var(--color-${name})`,
                                                        } as React.CSSProperties
                                                    }
                                                />
                                                {chartConfig[name as keyof typeof chartConfig]
                                                    ?.label || name}
                                                <div className="ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums text-foreground">
                                                    {formattedValue} USDC
                                                </div>
                                            </>
                                        );
                                    }}
                                    hideLabel
                                />
                            }
                        />
                        <Pie
                            data={chartData}
                            dataKey="value"
                            innerRadius={60}
                            nameKey="fillType"
                            strokeWidth={5}
                        >
                            <Label
                                content={({ viewBox }) => {
                                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                        return (
                                            <text
                                                dominantBaseline="middle"
                                                textAnchor="middle"
                                                x={viewBox.cx}
                                                y={viewBox.cy}
                                            >
                                                <tspan
                                                    className="fill-foreground text-3xl font-bold"
                                                    x={viewBox.cx}
                                                    y={viewBox.cy}
                                                >
                                                    {percentageDisplay}
                                                </tspan>
                                                <tspan
                                                    className="fill-muted-foreground"
                                                    x={viewBox.cx}
                                                    y={(viewBox.cy || 0) + 24}
                                                >
                                                    via Renegade
                                                </tspan>
                                            </text>
                                        );
                                    }
                                }}
                            />
                        </Pie>
                        <ChartLegend content={<ChartLegendContent nameKey="fillType" />} />
                    </PieChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}

// Skeleton for loading state
export function RenegadeFillChartSkeleton() {
    return (
        <Card className="h-full border-none flex flex-col">
            <CardContent className="relative min-h-[400px]">
                <GlyphLoadingIndicator />
            </CardContent>
        </Card>
    );
}

// Dynamic wrapper to lazy-load chart with heavy dependencies
const RoutedRenegadeChartLazy = dynamic(
    () =>
        import("./routed-through-renegade-chart").then((mod) => ({
            default: mod.RoutedRenegadeChartInner,
        })),
    {
        loading: () => <RenegadeFillChartSkeleton />,
        ssr: false,
    },
);

export function RoutedRenegadeChartClient({ data }: RoutedRenegadeChartProps) {
    return <RoutedRenegadeChartLazy data={data} />;
}
