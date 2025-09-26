import numeral from "numeral";
import * as React from "react";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { arbitrum, base } from "viem/chains";
import type { NetFlowData } from "@/app/stats/actions/fetch-net-flow";
import type { TransferData } from "@/app/stats/actions/fetch-transfer-data";

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
    date: string;
    arbitrumDeposits: number;
    baseDeposits: number;
    arbitrumWithdrawals: number;
    baseWithdrawals: number;
};

const chartConfig = {
    arbitrumDeposits: {
        color: "hsl(var(--chart-blue))",
        label: "Arbitrum Deposits",
    },
    arbitrumWithdrawals: {
        color: "hsl(var(--chart-blue))",
        label: "Arbitrum Withdrawals",
    },
    baseDeposits: {
        color: "hsl(var(--chart-1))",
        label: "Base Deposits",
    },
    baseWithdrawals: {
        color: "hsl(var(--chart-1))",
        label: "Base Withdrawals",
    },
} satisfies ChartConfig;

// Data is already in the correct format from the server action
// No transformation needed

interface InflowsChartProps {
    chainId: number;
    transferData: TransferData[];
    netFlowData: NetFlowData;
}

export function InflowsChart({ chainId, transferData, netFlowData }: InflowsChartProps) {
    const chartData = React.useMemo(() => {
        if (!transferData) return [];

        const filteredData = transferData.filter((item) => {
            if (!chainId) return true;
            if (chainId === arbitrum.id)
                return item.arbitrumDeposits > 0 || item.arbitrumWithdrawals > 0;
            if (chainId === base.id) return item.baseDeposits > 0 || item.baseWithdrawals > 0;
            return true;
        });
        return filteredData;
    }, [transferData, chainId]);

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
                            dataKey="date"
                            minTickGap={32}
                            tickFormatter={(value) => {
                                const date = new Date(value);
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
                                        return new Date(value).toLocaleDateString("en-US", {
                                            day: "numeric",
                                            month: "short",
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
