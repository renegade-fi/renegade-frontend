import numeral from "numeral";
import * as React from "react";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { arbitrum, base } from "viem/chains";

import {
    type TransferData,
    useExternalTransferLogs,
} from "@/app/stats/hooks/use-external-transfer-data";

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

import { extractSupportedChain, getFormattedChainName } from "@/lib/viem";

type ChartData = {
    timestamp: string;
    arbitrumDeposits: number;
    baseDeposits: number;
    arbitrumWithdrawals: number;
    baseWithdrawals: number;
};

const chartConfig = {
    arbitrumDeposits: {
        label: "Arbitrum Deposits",
        color: "hsl(var(--chart-blue))",
    },
    baseDeposits: {
        label: "Base Deposits",
        color: "hsl(var(--chart-1))",
    },
    arbitrumWithdrawals: {
        label: "Arbitrum Withdrawals",
        color: "hsl(var(--chart-blue))",
    },
    baseWithdrawals: {
        label: "Base Withdrawals",
        color: "hsl(var(--chart-1))",
    },
} satisfies ChartConfig;

function computeChartData(arbitrumData: TransferData, baseData: TransferData) {
    const data: ChartData[] = [];
    for (const [timestamp, bucket] of arbitrumData.entries()) {
        const arbitrumDeposits = bucket.depositAmount;
        const arbitrumWithdrawals = bucket.withdrawalAmount * -1;
        const baseDeposits = baseData.get(timestamp)?.depositAmount ?? 0;
        const baseWithdrawals = (baseData.get(timestamp)?.withdrawalAmount ?? 0) * -1;
        data.push({
            timestamp: timestamp.toString(),
            arbitrumDeposits,
            baseDeposits,
            arbitrumWithdrawals,
            baseWithdrawals,
        });
    }
    return data;
}

export function InflowsChart({ chainId }: { chainId: number }) {
    const { data: arbitrumData } = useExternalTransferLogs({
        chainId: arbitrum.id,
    });
    const { data: baseData } = useExternalTransferLogs({ chainId: base.id });

    const chartData = React.useMemo(() => {
        if (!arbitrumData || !baseData) return [];
        const data = computeChartData(arbitrumData, baseData);
        const filteredData = data.filter((item) => {
            if (!chainId) return true;
            if (chainId === arbitrum.id)
                return item.arbitrumDeposits > 0 || item.arbitrumWithdrawals > 0;
            if (chainId === base.id) return item.baseDeposits > 0 || item.baseWithdrawals > 0;
            return true;
        });
        return filteredData;
    }, [arbitrumData, baseData, chainId]);

    const netFlowData = React.useMemo(() => {
        if (chartData.length === 0) return null;

        const lastTimestamp = Math.max(...chartData.map((item) => Number(item.timestamp)));

        // Calculate the start time (24 hours before the last timestamp)
        const startTime = lastTimestamp - 24 * 60 * 60 * 1000;

        const last24HoursData = chartData.filter((item) => {
            const itemTimestamp = Number(item.timestamp);
            return itemTimestamp > startTime;
        });

        const netFlow = last24HoursData.reduce((sum, item) => {
            if (chainId === arbitrum.id) {
                return sum + item.arbitrumDeposits + item.arbitrumWithdrawals;
            } else if (chainId === base.id) {
                return sum + item.baseDeposits + item.baseWithdrawals;
            }
            return (
                sum +
                item.arbitrumDeposits +
                item.baseDeposits +
                item.arbitrumWithdrawals +
                item.baseWithdrawals
            );
        }, 0);

        return { netFlow };
    }, [chainId, chartData]);

    const isSuccess = netFlowData !== null;

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
                        {isSuccess ? (
                            numeral(netFlowData.netFlow).format("$0.00a")
                        ) : (
                            <Skeleton className="h-10 w-40" />
                        )}
                    </CardTitle>
                    <CardDescription>24H Net Flow{chainSuffix}</CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <ChartContainer className="aspect-auto h-[250px] w-full" config={chartConfig}>
                    <BarChart
                        accessibilityLayer
                        barGap={0}
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
                                    month: "short",
                                    day: "numeric",
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
                                    formatter={(value, name, _item, _index) => {
                                        const n = numeral(Math.abs(Number(value))).format(
                                            "$0,0.00a",
                                        );
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
                                            </>
                                        );
                                    }}
                                    labelFormatter={(value) => {
                                        return new Date(Number(value)).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                            timeZone: "UTC",
                                        });
                                    }}
                                    nameKey="arbitrumDeposits"
                                />
                            }
                        />
                        <ChartLegend content={<ChartLegendContent />} />

                        {showOnlyBase ? null : (
                            <Bar
                                dataKey="arbitrumDeposits"
                                fill={`var(--color-arbitrumDeposits)`}
                                stackId="a"
                            />
                        )}
                        {showOnlyBase ? null : (
                            <Bar
                                dataKey="arbitrumWithdrawals"
                                fill={`var(--color-arbitrumWithdrawals)`}
                                stackId="b"
                            />
                        )}
                        {showOnlyArbitrum ? null : (
                            <Bar
                                dataKey="baseDeposits"
                                fill={`var(--color-baseDeposits)`}
                                stackId="a"
                            />
                        )}
                        {showOnlyArbitrum ? null : (
                            <Bar
                                dataKey="baseWithdrawals"
                                fill={`var(--color-baseWithdrawals)`}
                                stackId="b"
                            />
                        )}
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
