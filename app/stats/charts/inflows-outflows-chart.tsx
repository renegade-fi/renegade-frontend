"use client"

import * as React from "react"

import numeral from "numeral"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import { useExternalTransferLogs } from "@/app/stats/hooks/use-external-transfer-data"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const chartConfig = {
  depositAmount: {
    label: "Deposits",
    color: "hsl(var(--chart-blue))",
  },
  withdrawalAmount: {
    label: "Withdrawals",
    color: "#FFF",
  },
} satisfies ChartConfig

export function InflowsOutflowsChart() {
  const { data } = useExternalTransferLogs()
  const chartData = data?.map((day) => ({
    timestamp: day.timestamp,
    depositAmount: day.depositAmount,
    withdrawalAmount: day.withdrawalAmount * -1,
  }))
  console.log("🚀 ~ InflowsOutflowsChart ~ data:", data)
  return (
    <Card className="w-full rounded-none">
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
          <CardTitle className="font-serif text-4xl font-bold">
            {/* {cumulativeVolumeLabel ? (
              cumulativeVolumeLabel
            ) : (
              <Skeleton className="h-10 w-40" />
            )} */}
          </CardTitle>
          {/* <CardDescription>Past {value}</CardDescription> */}
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
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
              dataKey="timestamp"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(Number(value))
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                })
              }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[150px]"
                  nameKey="depositAmount"
                  formatter={(value, name, item, index) => {
                    const n = numeral(Math.abs(Number(value))).format(
                      "$0,0.00a",
                    )
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
                        {chartConfig[name as keyof typeof chartConfig]?.label ||
                          name}
                        <div className="ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums text-foreground">
                          {n}
                        </div>
                      </>
                    )
                  }}
                  labelFormatter={(value) => {
                    return new Date(Number(value)).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "numeric",
                    })
                  }}
                />
              }
            />
            <Bar
              dataKey="depositAmount"
              fill={`var(--color-depositAmount)`}
            />
            <Bar
              dataKey="withdrawalAmount"
              fill={`var(--color-withdrawalAmount)`}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
