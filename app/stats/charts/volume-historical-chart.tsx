"use client"

import * as React from "react"

import { useQueryClient } from "@tanstack/react-query"
import numeral from "numeral"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import {
  getCumulativeVolume,
  useCumulativeVolume,
} from "@/app/stats/hooks/use-cumulative-volume"
import {
  getHistoricalVolume,
  useHistoricalVolume,
} from "@/app/stats/hooks/use-historical-volume"

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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

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
} as const

export function VolumeHistoricalChart() {
  const [value, setValue] = React.useState<keyof typeof timePeriod>("year")

  const now = roundToNextDay(Math.floor(Date.now() / 1000)) // Current time in seconds
  const { data } = useHistoricalVolume({
    from: now - timePeriod[value],
    to: now,
  })

  const { data: cumulativeData } = useCumulativeVolume({
    from: now - timePeriod[value],
    to: now,
  })
  const cumulativeVolumeLabel = React.useMemo(() => {
    if (!cumulativeData) return ""
    return formatStat(cumulativeData[cumulativeData.length - 1].volume)
  }, [cumulativeData])

  const queryClient = useQueryClient()

  // Prefetch data for the other time period
  React.useEffect(() => {
    const otherPeriod = value === "year" ? "month" : "year"
    const from = now - timePeriod[otherPeriod]

    queryClient.prefetchQuery({
      queryKey: [
        "stats",
        "historical-volume",
        { from, to: now, interval: 86400 },
      ],
      queryFn: () => getHistoricalVolume({ from, to: now, interval: 86400 }),
    })

    queryClient.prefetchQuery({
      queryKey: ["stats", "cumulative-volume", { from, to: now }],
      queryFn: () => getCumulativeVolume({ from, to: now }),
    })
  }, [now, queryClient, value])

  return (
    <Card className="w-full rounded-none">
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
          <CardTitle className="font-serif text-4xl font-bold">
            {cumulativeVolumeLabel ? (
              cumulativeVolumeLabel
            ) : (
              <Skeleton className="h-10 w-40" />
            )}
          </CardTitle>
          <CardDescription>Past {value}</CardDescription>
        </div>
        <div className="flex px-8">
          <ToggleGroup
            type="single"
            size="lg"
            value={value}
            onValueChange={(value) => {
              if (value) setValue(value as keyof typeof timePeriod)
            }}
          >
            <ToggleGroupItem
              value="month"
              aria-label="1M"
            >
              M
            </ToggleGroupItem>
            <ToggleGroupItem
              value="year"
              aria-label="1Y"
            >
              Y
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <BarChart
            accessibilityLayer
            data={data}
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
                  nameKey="volume"
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
                      hour: "numeric",
                      minute: "numeric",
                    })
                  }}
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
