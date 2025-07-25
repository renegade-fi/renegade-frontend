import numeral from "numeral";
import * as React from "react";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { arbitrum, base } from "viem/chains";

import { useVolumeData, type VolumeData } from "@/app/stats/hooks/use-volume-data";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    type ChartConfig,
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";

import { formatStat } from "@/lib/format";
import { extractSupportedChain, getFormattedChainName } from "@/lib/viem";

type ChartData = {
    timestamp: string;
    arbitrumVolume: number;
    baseVolume: number;
};

const chartConfig = {
    arbitrumVolume: {
        color: "hsl(var(--chart-blue))",
        label: "Arbitrum Volume",
    },
    baseVolume: {
        color: "hsl(var(--chart-1))",
        label: "Base Volume",
    },
} satisfies ChartConfig;

function computeChartData(arbitrumVolumeData: VolumeData, baseVolumeData: VolumeData) {
    const data: ChartData[] = [];
    if (!arbitrumVolumeData) return data;
    for (const [timestamp, arbitrumDataPoint] of arbitrumVolumeData.entries()) {
        const baseDataPoint = baseVolumeData?.get(timestamp) ?? null;
        data.push({
            arbitrumVolume: arbitrumDataPoint.volume,
            baseVolume: baseDataPoint?.volume ?? 0,
            timestamp: (timestamp * 1000).toString(),
        });
    }
    return data;
}

export function VolumeChart({ chainId }: { chainId: number }) {
    const { data: arbitrumVolumeData } = useVolumeData(arbitrum.id);
    const { data: baseVolumeData } = useVolumeData(base.id);

    const chartData = React.useMemo(() => {
        if (!arbitrumVolumeData || !baseVolumeData) return [];
        const chartData = computeChartData(arbitrumVolumeData, baseVolumeData);
        const filteredChartData = chartData.filter((data) => {
            if (chainId === arbitrum.id) return data.arbitrumVolume > 0;
            if (chainId === base.id) return data.baseVolume > 0;
            return true;
        });
        return filteredChartData;
    }, [arbitrumVolumeData, baseVolumeData, chainId]);

    const cumVol = useMemo(() => {
        if (!chartData) return 0;
        const cumArbVol = chartData[chartData.length - 2]?.arbitrumVolume;
        const cumBaseVol = chartData[chartData.length - 2]?.baseVolume;
        if (chainId === arbitrum.id) return cumArbVol;
        if (chainId === base.id) return cumBaseVol;
        return cumArbVol + cumBaseVol;
    }, [chainId, chartData]);

    const cumVolLabel = formatStat(cumVol);

    const chainSuffix = useMemo(() => {
        if (!chainId) return "";
        const chain = extractSupportedChain(chainId);
        return ` on ${getFormattedChainName(chain.id)}`;
    }, [chainId]);

    const showOnlyArbitrum = chainId === arbitrum.id;
    const showOnlyBase = chainId === base.id;

    return (
        <Card className="w-full rounded-none">
            <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
                <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
                    <CardTitle className="font-serif text-4xl font-bold tracking-tighter lg:tracking-normal">
                        {cumVol ? cumVolLabel : <Skeleton className="h-10 w-40" />}
                    </CardTitle>
                    <CardDescription>24H Volume{chainSuffix}</CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <ChartContainer className="h-[250px] w-full" config={chartConfig}>
                    <BarChart
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
                            minTickGap={32}
                            tickFormatter={(value) => {
                                const date = new Date(Number(value));
                                return date.toLocaleDateString("en-US", {
                                    day: "numeric",
                                    month: "short",
                                    timeZone: "UTC",
                                });
                            }}
                            tickLine={false}
                            tickMargin={8}
                        />
                        <ChartTooltip
                            content={
                                <ChartTooltipContent
                                    className="w-64"
                                    formatter={(value, name, item, index) => {
                                        const n = numeral(value).format("$0,0.00a");
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
                                                    {n}
                                                </div>
                                                {index === 1 && (
                                                    <div className="mt-1.5 flex basis-full items-center border-t pt-1.5 text-xs font-medium text-foreground">
                                                        Total
                                                        <div className="ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums text-foreground">
                                                            {numeral(
                                                                item.payload.arbitrumVolume +
                                                                    item.payload.baseVolume,
                                                            ).format("$0,0.00a")}
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        );
                                    }}
                                    labelFormatter={(value) => {
                                        return new Date(Number(value)).toLocaleDateString("en-US", {
                                            day: "numeric",
                                            month: "short",
                                            timeZone: "UTC",
                                        });
                                    }}
                                    nameKey="arbitrumVolume"
                                />
                            }
                        />
                        <ChartLegend content={<ChartLegendContent />} />
                        {showOnlyBase ? null : (
                            <Bar
                                dataKey="arbitrumVolume"
                                fill={`var(--color-arbitrumVolume)`}
                                stackId="a"
                            />
                        )}
                        {showOnlyArbitrum ? null : (
                            <Bar
                                dataKey="baseVolume"
                                fill={`var(--color-baseVolume)`}
                                stackId="a"
                            />
                        )}
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
