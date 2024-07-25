import React from "react"

import { OrderMetadata, Token } from "@renegade-fi/react"
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
import { remapToken } from "@/lib/token"

const chartConfig = {
  price: {
    label: "Binance Price",
    color: "hsl(var(--chart-yellow))",
  },
  fillPrice: {
    label: "Renegade Fill",
    color: "hsl(var(--chart-blue))",
  },
} satisfies ChartConfig

function calculateYAxisDomain(
  minValue: number,
  maxValue: number,
  offset: number = 0.1,
): [number, number] {
  const padding = (maxValue - minValue) * offset
  const lowerBound = Math.floor(minValue - padding)
  const upperBound = Math.ceil(maxValue + padding)
  return [lowerBound, upperBound]
}

interface ChartData {
  price: number
  timestamp: number
  fillPrice?: number
  vwap?: number
  volume?: number
}

export function FillChart({ order }: { order: OrderMetadata }) {
  const token = Token.findByAddress(order.data.base_mint)

  const formattedFills = order.fills
    .map(fill => ({
      timestamp: Number(fill.price.timestamp) * 1000,
      amount: Number(formatNumber(fill.amount, token.decimals)),
      price: Number(fill.price.price),
    }))
    .sort((a, b) => a.timestamp - b.timestamp)

  const resolutionMs = 7 * 1000

  const { newFromMs, newToMs } = React.useMemo(() => {
    const minFillTimestamp = formattedFills[0].timestamp
    const maxFillTimestamp = formattedFills[formattedFills.length - 1].timestamp
    const fillTimeSpan = maxFillTimestamp - minFillTimestamp

    let startTime,
      endTime = 0

    // TODO: What is best value for this?
    // Chart width / point spacing
    const pointsCount = Math.floor(527 / 10)
    const requiredTimeSpan = pointsCount * resolutionMs

    if (formattedFills.length === 1) {
      startTime = minFillTimestamp - requiredTimeSpan / 2
      endTime = maxFillTimestamp + requiredTimeSpan / 2
    } else {
      const halfTimeSpan = (requiredTimeSpan - fillTimeSpan) / 2
      startTime = minFillTimestamp - halfTimeSpan
      endTime = maxFillTimestamp + halfTimeSpan
    }
    return {
      newFromMs: Math.floor(startTime / 60000) * 60000,
      newToMs: Math.ceil(endTime / 60000) * 60000,
    }
  }, [formattedFills, resolutionMs])

  const { data: ohlc } = useOHLC({
    instrument: `${remapToken(token.ticker)}_usdt`,
    startDateMs: newFromMs,
    endDateMs: newToMs,
    timeInterval: "minutes",
  })

  const threshold = 150

  const chartData = React.useMemo(() => {
    if (!ohlc) return []

    const ohlcStartTime = ohlc[0].time
    const ohlcEndTime = ohlc[ohlc.length - 1].time

    // Step 1: Convert price data to the desired resolution
    const adjustedPriceData: Partial<ChartData>[] = []
    let startTimestamp = Math.floor(newFromMs / resolutionMs) * resolutionMs
    for (let i = 0; i < ohlc.length; i++) {
      const bar = ohlc[i]
      const endTimestamp = bar.time + 60000 // Each bar is 1 minute
      while (startTimestamp < endTimestamp) {
        if (startTimestamp >= ohlcStartTime && startTimestamp < ohlcEndTime) {
          adjustedPriceData.push({
            timestamp: startTimestamp,
            price: order.data.side === "Sell" ? bar.low : bar.high,
          })
        }
        startTimestamp += resolutionMs
      }
    }

    const adjustedFillData = formattedFills.map(fillPoint => {
      // Aligned timestamp will never be greater than fill timestamp
      // Can be up to resolutionMs off
      const alignedTimestamp =
        Math.floor(fillPoint.timestamp / resolutionMs) * resolutionMs
      return {
        timestamp: alignedTimestamp,
        fillPrice: fillPoint.price,
        volume: fillPoint.amount,
      }
    })

    // Step 3: Merge adjusted price and fill data
    const result = adjustedPriceData.map(pricePoint => {
      const fillPoint = adjustedFillData.find(
        f => f.timestamp === pricePoint.timestamp,
      ) || { volume: 0, fillPrice: undefined }
      return {
        price: pricePoint.price,
        fillPrice: fillPoint.fillPrice,
        volume: fillPoint.volume,
        timestamp: pricePoint.timestamp,
      }
    })

    // // Step 4: Limit Points (Optional)
    // if (result.length > threshold) {
    //   const step = Math.ceil(result.length / threshold)
    //   const limitedData = result.filter((_, index) => index % step === 0)
    //   return limitedData
    // }

    return result
  }, [formattedFills, newFromMs, ohlc, order.data.side, resolutionMs])

  function formatTimestamp(value: number): string {
    const date = new Date(value)
    return date.toLocaleString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    })
  }

  const [minValue, maxValue] = React.useMemo(
    () =>
      chartData.reduce(
        ([min, max], item) => [
          Math.min(
            min,
            item.price ?? Number.POSITIVE_INFINITY,
            item.fillPrice ?? Number.POSITIVE_INFINITY,
          ),
          Math.max(
            max,
            item.price ?? Number.NEGATIVE_INFINITY,
            item.fillPrice ?? Number.NEGATIVE_INFINITY,
          ),
        ],
        [Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY],
      ),
    [chartData],
  )

  const firstFillIndex = chartData.findIndex(item => item.fillPrice)

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
              dataKey="fillPrice"
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
            <Line
              dataKey="fillPrice"
              stroke="var(--color-fillPrice)"
              fill="var(--color-fillPrice)"
              strokeWidth={0}
              isAnimationActive={false}
            />
            <Line
              animationEasing="ease-out"
              animationDuration={750}
              dataKey="price"
              type="linear"
              fill="var(--color-price)"
              stroke="var(--color-price)"
              dot={false}
            />
            {}
            <ChartTooltip
              content={
                <ChartTooltipContent
                  hideLabel
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
                        {formatCurrency(Number(value))}
                      </div>
                    </>
                  )}
                />
              }
              cursor
              defaultIndex={firstFillIndex}
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
