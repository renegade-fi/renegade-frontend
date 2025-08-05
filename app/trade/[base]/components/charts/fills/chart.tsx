import type { OrderMetadata } from "@renegade-fi/react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    type ChartConfig,
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";

import { useOHLC } from "@/hooks/use-ohlc";
import { getCanonicalExchange, resolveAddress, USDT_TICKER } from "@/lib/token";

import {
    calculateMinMax,
    calculateTimeRange,
    calculateYAxisDomain,
    createPriceFormatter,
    formatFills,
    percentageFormatter,
    processChartData,
} from "./helpers";

export function FillChart({ order }: { order: OrderMetadata }) {
    const canonicalExchange = getCanonicalExchange(order.data.base_mint);

    const chartConfig = {
        fillPrice: {
            color: "hsl(var(--chart-blue))",
            label: "Renegade Fill",
        },
        price: {
            color: "hsl(var(--chart-yellow))",
            label: `${canonicalExchange} Price`,
        },
    } satisfies ChartConfig;

    const formattedFills = formatFills(order);

    const { startMs, endMs } = calculateTimeRange(formattedFills);

    const baseToken = resolveAddress(order.data.base_mint);
    const { data: ohlc } = useOHLC({
        endDateMs: endMs,
        invert: baseToken.ticker === USDT_TICKER,
        mint: order.data.base_mint,
        startDateMs: startMs,
        timeInterval: "minutes",
    });

    const chartData = processChartData(formattedFills, ohlc, order.data.side);

    const [minValue, maxValue] = calculateMinMax(chartData);
    const priceFormatter = createPriceFormatter();

    return (
        <Card className="border-0">
            <CardHeader>
                <CardTitle>Fill Chart</CardTitle>
                <CardDescription>
                    Showing fills compared to {canonicalExchange} price
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig}>
                    <LineChart
                        accessibilityLayer
                        data={chartData}
                        margin={{
                            left: 12,
                            right: 12,
                        }}
                    >
                        <CartesianGrid vertical={false} />
                        <XAxis
                            axisLine={false}
                            dataKey="timestamp"
                            tickFormatter={formatTimestamp}
                            tickLine={false}
                            tickMargin={8}
                        />
                        <YAxis
                            axisLine={false}
                            dataKey="price"
                            domain={calculateYAxisDomain(minValue, maxValue)}
                            tickCount={5}
                            tickFormatter={priceFormatter}
                            tickLine={false}
                        />
                        <ChartLegend content={<ChartLegendContent />} />
                        <Line
                            dataKey="fillPrice"
                            fill="var(--color-fillPrice)"
                            isAnimationActive={false}
                            stroke="var(--color-fillPrice)"
                            strokeWidth={0}
                        />
                        <Line
                            animationDuration={750}
                            animationEasing="ease-out"
                            dataKey="price"
                            dot={false}
                            fill="var(--color-price)"
                            stroke="var(--color-price)"
                            type="linear"
                        />
                        <ChartTooltip
                            content={
                                <ChartTooltipContent
                                    className="w-[200px]"
                                    formatter={(value, name, item, index) => (
                                        <>
                                            <div
                                                className="h-2.5 w-2.5 shrink-0 rounded-[2px] bg-[--color-bg]"
                                                style={
                                                    {
                                                        "--color-bg": `var(--color-${name})`,
                                                    } as React.CSSProperties
                                                }
                                            />
                                            {chartConfig[name as keyof typeof chartConfig]?.label ||
                                                name}
                                            <div className="ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums text-foreground">
                                                {priceFormatter(Number(value))}
                                            </div>
                                            {index === 1 &&
                                                isPositiveRelativeFill(
                                                    item.payload.fillPrice,
                                                    item.payload.price,
                                                    order.data.side,
                                                ) && (
                                                    <div className="mt-1.5 flex basis-full items-center border-t pt-1.5 text-xs font-medium text-foreground">
                                                        Relative Fill
                                                        <div className="ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums text-foreground">
                                                            {/* TODO: [CORRECTNESS] Use orderbook to calculate more accurate relative fill */}
                                                            {percentageFormatter(
                                                                order.data.side === "Buy"
                                                                    ? item.payload.price
                                                                    : item.payload.fillPrice,
                                                                order.data.side === "Buy"
                                                                    ? item.payload.fillPrice
                                                                    : item.payload.price,
                                                            )}
                                                            <span className="font-normal text-muted-foreground">
                                                                %
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                        </>
                                    )}
                                    labelFormatter={(value) => {
                                        return new Date(Number(value)).toLocaleDateString("en-US", {
                                            day: "numeric",
                                            hour: "numeric",
                                            minute: "numeric",
                                            month: "long",
                                            second: "numeric",
                                        });
                                    }}
                                />
                            }
                            cursor
                        />
                    </LineChart>
                </ChartContainer>
            </CardContent>
            <CardFooter>
                <div className="flex w-full items-start gap-2 text-sm">
                    <div className="grid gap-2">
                        <div className="flex items-center gap-2 text-xs leading-none text-muted-foreground">
                            Data by Amberdata.
                        </div>
                    </div>
                </div>
            </CardFooter>
        </Card>
    );
}

function formatTimestamp(value: number): string {
    const date = new Date(Number(value));
    return date.toLocaleString("en-US", {
        hour: "numeric",
        minute: "2-digit",
    });
}

function isPositiveRelativeFill(fillPrice: number, price: number, side: "Buy" | "Sell"): boolean {
    return side === "Buy" ? fillPrice < price : fillPrice > price;
}
