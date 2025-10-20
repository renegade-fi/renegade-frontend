import numeral from "numeral";
import type * as React from "react";
import { Cell, Label, Pie, PieChart } from "recharts";

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

interface RenegadeFillChartProps {
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

export function RenegadeFillChart({ data }: RenegadeFillChartProps) {
    const { totalSize, renegadeFillPercent } = data;

    // Only render if we have the fill percentage data
    if (renegadeFillPercent === undefined) {
        return null;
    }

    const renegadeFillAmount = totalSize * renegadeFillPercent;
    const binanceFillAmount = totalSize * (1 - renegadeFillPercent);

    const chartData = [
        {
            fill: "var(--color-renegadeFill)",
            name: "renegadeFill",
            value: renegadeFillAmount,
        },
        {
            fill: "var(--color-binanceFill)",
            name: "binanceFill",
            value: binanceFillAmount,
        },
    ];

    const percentageDisplay = `${formatUSDC(renegadeFillPercent * 100)}%`;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Routed through Renegade</CardTitle>
                <CardDescription>
                    The Renegade strategy fills trades using Renegade liquidity and backstops using
                    Binance if needed.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig}>
                    <PieChart>
                        <ChartTooltip
                            content={
                                <ChartTooltipContent
                                    formatter={(value, name) => {
                                        const formattedValue = numeral(value).format("$0,0.00");
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
                            outerRadius={80}
                            strokeWidth={5}
                        >
                            {chartData.map((entry) => (
                                <Cell fill={entry.fill} key={entry.name} />
                            ))}
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
                                                    className="fill-foreground font-bold text-3xl"
                                                    x={viewBox.cx}
                                                    y={viewBox.cy}
                                                >
                                                    {percentageDisplay}
                                                </tspan>
                                                <tspan
                                                    className="fill-muted-foreground"
                                                    x={viewBox.cx}
                                                    y={(viewBox.cy || 0) + 20}
                                                >
                                                    via Renegade
                                                </tspan>
                                            </text>
                                        );
                                    }
                                }}
                            />
                        </Pie>
                        <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                    </PieChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
