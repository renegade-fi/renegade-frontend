"use client"

import { useMemo } from "react"

import { OrderMetadata, PartialOrderFill, Token } from "@renegade-fi/react"
import { TrendingUp } from "lucide-react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

import { useOHLC } from "@/hooks/use-ohlc"
import { formatCurrency, formatNumber } from "@/lib/format"

const chartConfig = {
  renegade: {
    label: "Renegade Fill",
    color: "hsl(var(--chart-blue))",
  },
  binance: {
    label: "Binance Price",
    color: "hsl(var(--chart-yellow))",
  },
  vwap: {
    label: "VWAP",
    color: "hsl(var(--chart-blue))",
  },
  timestamp: {
    label: "Date",
  },
} satisfies ChartConfig

function calculateYAxisDomain(
  minValue: number,
  maxValue: number,
  offset: number = 0.0005,
): [number, number] {
  // Helper function to get the number of digits before the decimal point
  const getDigits = (num: number): number =>
    Math.floor(Math.log10(Math.abs(num))) + 1

  // Calculate the order of magnitude for rounding
  // TODO: Make this dynamic based on the minValue and maxValue
  const digits = Math.max(getDigits(minValue), getDigits(maxValue)) - 2
  const roundTo = Math.pow(10, digits - 1)

  // Calculate the domain bounds with a 5% padding
  const lowerBound =
    Math.floor((minValue - minValue * offset) / roundTo) * roundTo
  const upperBound =
    Math.ceil((maxValue + maxValue * offset) / roundTo) * roundTo

  return [lowerBound, upperBound]
}

interface ChartData {
  binance: number
  timestamp: number
  renegade?: number
  vwap?: number
  volume?: number
}

export function FillChart({ order }: { order: OrderMetadata }) {
  const token = Token.findByAddress(order.data.base_mint)

  const formattedFills = order.fills
    .map(fill => ({
      timestamp: Number(fill.timestamp),
      amount: Number(formatNumber(fill.amount, token.decimals)),
      price: Number(fill.price),
    }))
    .sort((a, b) => a.timestamp - b.timestamp)

  const firstFillTimestamp = formattedFills[0].timestamp
  const lastFillTimestamp = formattedFills[formattedFills.length - 1].timestamp

  let from: number
  let to: number
  const timeSpan =
    formattedFills.length === 1
      ? 2 * 60 * 60 * 1000
      : lastFillTimestamp - firstFillTimestamp
  const padding = Math.floor(0.1 * timeSpan) // 10% padding on both sides

  if (formattedFills.length === 1) {
    const fill = formattedFills[0]
    from = fill.timestamp - padding
    to = fill.timestamp + padding
  } else {
    from = formattedFills[0].timestamp - padding
    to = formattedFills[formattedFills.length - 1].timestamp + padding
  }

  const { data: ohlc } = useOHLC(token.ticker, from, to, "minutes")

  const chartData = useMemo(() => {
    if (!ohlc) return []
    const targetElements = 150
    const resolutionFactor = Math.ceil(ohlc.length / targetElements)

    const temp: Array<ChartData> = ohlc.map(ohlc => ({
      binance: order.data.side === "Sell" ? ohlc.low : ohlc.high,
      timestamp: ohlc.time,
      vwap: undefined,
    }))

    temp.sort((a, b) => a.timestamp - b.timestamp)

    let cumVolume = 0
    let cumPriceVolume = 0

    // Map fills to closest candle
    // Closest candle should not be in the future relative to the fill
    formattedFills.forEach(fill => {
      const closest = temp.reduce((prev, curr) => {
        return curr.timestamp <= fill.timestamp &&
          curr.timestamp > prev.timestamp
          ? curr
          : prev
      }, temp[0])

      if (closest) {
        closest.renegade = Number(fill.price.toFixed(2))
        closest.volume = Number(fill.amount.toFixed(2))
      }
    })

    // Sample data to keep chart performant
    const sampledTemp = temp.filter(
      (_, index) => index % resolutionFactor === 0 || temp[index].renegade,
    )

    // Calculate and set VWAP data within relevant time range
    sampledTemp.forEach(data => {
      if (data.renegade && data.volume) {
        cumVolume += data.volume
        cumPriceVolume += data.renegade * data.volume
      }
      if (
        data.renegade ||
        (data.timestamp >= firstFillTimestamp &&
          data.timestamp <= lastFillTimestamp)
      ) {
        data.vwap = cumVolume > 0 ? cumPriceVolume / cumVolume : undefined
      }
    })

    return sampledTemp
  }, [
    firstFillTimestamp,
    formattedFills,
    lastFillTimestamp,
    ohlc,
    order.data.side,
  ])

  function formatTimestamp(value: number): string {
    const date = new Date(value)
    return date.toLocaleString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    })
  }

  const minValue = useMemo(
    () =>
      Math.min(
        ...chartData.map(item =>
          Math.min(
            item.binance ?? Number.POSITIVE_INFINITY,
            item.renegade ?? Number.POSITIVE_INFINITY,
          ),
        ),
      ),
    [chartData],
  )
  const maxValue = useMemo(
    () =>
      Math.max(
        ...chartData.map(item =>
          Math.max(
            item.binance ?? Number.NEGATIVE_INFINITY,
            item.renegade ?? Number.NEGATIVE_INFINITY,
          ),
        ),
      ),
    [chartData],
  )

  return (
    <Card className="border-0">
      <CardHeader>
        <CardTitle>Fill Chart</CardTitle>
        <CardDescription>
          Showing fills compared to Binance price
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
              dataKey="timestamp"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={formatTimestamp}
            />
            <YAxis
              dataKey="renegade"
              axisLine={false}
              tickLine={false}
              tickCount={5}
              domain={calculateYAxisDomain(minValue, maxValue)}
              tickFormatter={(value: number) =>
                `${value.toLocaleString("en-US", {
                  minimumFractionDigits: value > 10_000 ? 0 : 2,
                  maximumFractionDigits: value > 10_000 ? 0 : 2,
                  currency: "USD",
                  style: "currency",
                })}`
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelKey="saving"
                  className="min-w-[200px]"
                  hideIndicator
                  hideLabel
                  formatter={(value, name, item, index, payload) => {
                    return (
                      <div className="flex flex-1 items-center justify-between leading-none">
                        <div className="grid gap-1.5">
                          <span className="text-muted-foreground">
                            {
                              chartConfig[item.name as keyof typeof chartConfig]
                                .label
                            }
                          </span>
                        </div>
                        {item.value && (
                          <span className="font-mono font-medium tabular-nums text-foreground">
                            {formatCurrency(Number(item.value))}
                          </span>
                        )}
                      </div>
                    )
                  }}
                />
              }
            />
            <Line
              dataKey="binance"
              type="natural"
              fill="var(--color-binance)"
              stroke="var(--color-binance)"
              dot={false}
            />
            <Line
              dataKey="renegade"
              type="natural"
              stroke="var(--color-renegade)"
              fill="var(--color-renegade)"
            />
            <Line
              dataKey="vwap"
              type="monotone"
              fill="url(#fillDesktop)"
              stroke="var(--color-renegade)"
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 font-medium leading-none">
              Saving 10% compared to Binance
              <TrendingUp className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-2 leading-none text-muted-foreground">
              Source: Amberdata
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}
