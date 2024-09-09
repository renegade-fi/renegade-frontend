"use client"

import * as React from "react"

import numeral from "numeral"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import { useCumulativeVolume } from "@/app/stats/hooks/use-cumulative-volume"
import { useVolumeData } from "@/app/stats/hooks/use-volume-data"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"

import { formatStat } from "@/lib/format"

const chartConfig = {
  volume: {
    label: "Volume",
    color: "hsl(var(--chart-blue))",
  },
} satisfies ChartConfig

/**
 * Rounds the given timestamp to the next day at midnight (UTC)
 * @param timestamp Unix timestamp in seconds
 * @returns Unix timestamp in seconds for the next day at midnight
 */
function roundToNextDay(timestamp: number): number {
  const date = new Date(timestamp * 1000)
  date.setUTCHours(24, 0, 0, 0)
  return Math.floor(date.getTime() / 1000)
}

const timePeriod = {
  year: 365 * 24 * 60 * 60,
  month: 30 * 24 * 60 * 60,
  day: 24 * 60 * 60,
} as const

export function VolumeChart() {
  const now = roundToNextDay(Math.floor(Date.now() / 1000)) // Current time in seconds
  const { data } = useVolumeData()

  const chartData = data?.map((dataPoint) => ({
    timestamp: (dataPoint.timestamp * 1000).toString(),
    volume: dataPoint.volume,
  }))

  // const { data: cumulativeData } = useCumulativeVolume({
  //   from: now - 2 * timePeriod.day,
  //   to: now,
  // })
  // const cumulativeVolumeLabel = React.useMemo(() => {
  //   if (!cumulativeData) return ""
  //   return formatStat(cumulativeData[cumulativeData.length - 1].volume)
  // }, [cumulativeData])
  const cumulativeVolume = chartData?.[chartData.length - 1]?.volume
  const cumulativeVolumeLabel = formatStat(cumulativeVolume ?? 0)

  return (
    <Card className="w-full rounded-none">
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
          <CardTitle className="font-serif text-4xl font-bold tracking-tighter lg:tracking-normal">
            {cumulativeVolumeLabel ? (
              cumulativeVolumeLabel
            ) : (
              <Skeleton className="h-10 w-40" />
            )}
          </CardTitle>
          <CardDescription>24H Volume</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer
          className="h-[250px] w-full"
          config={chartConfig}
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
              axisLine={false}
              dataKey="timestamp"
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(Number(value))
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  timeZone: "UTC",
                })
              }}
              tickLine={false}
              tickMargin={8}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[150px]"
                  formatter={(value, name, item, index) => {
                    const n = numeral(value).format("$0,0.00a")
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
                      timeZone: "UTC",
                    })
                  }}
                  nameKey="volume"
                />
              }
            />
            <Bar
              dataKey="volume"
              fill={`var(--color-volume)`}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
