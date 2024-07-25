import React from "react"

import { OrderMetadata, Token } from "@renegade-fi/react"
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
import { Side } from "@/lib/constants/protocol"
import { oneMinute } from "@/lib/constants/time"
import { formatCurrency, formatNumber, formatPercentage } from "@/lib/format"
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
  timestamp: string
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

  const resolutionMs = React.useMemo(() => {
    if (formattedFills.length === 1) {
      return oneMinute
    }
    const minTimeDiff = formattedFills.reduce((minDiff, fill, index) => {
      if (index === 0) return minDiff
      const timeDiff = fill.timestamp - formattedFills[index - 1].timestamp
      return Math.min(minDiff, timeDiff)
    }, Infinity)

    return minTimeDiff
  }, [formattedFills])

  const { startMs, endMs } = React.useMemo(() => {
    const minFillTimestamp = formattedFills[0].timestamp
    const maxFillTimestamp = formattedFills[formattedFills.length - 1].timestamp
    const fillTimeSpan = maxFillTimestamp - minFillTimestamp

    let startTime = 0
    let endTime = 0

    // TODO: Dynamically calculate based on resolution
    const pointsCount = 50
    const requiredTimeSpan = pointsCount * resolutionMs

    if (formattedFills.length === 1) {
      startTime = minFillTimestamp - requiredTimeSpan / 2
      endTime = maxFillTimestamp + requiredTimeSpan / 2
    } else {
      const halfTimeSpan = (requiredTimeSpan - fillTimeSpan) / 2
      startTime = minFillTimestamp - halfTimeSpan
      endTime = maxFillTimestamp + halfTimeSpan
    }
    // Round to nearest minute
    return {
      startMs: Math.floor(startTime / 60000) * 60000,
      endMs: Math.ceil(endTime / 60000) * 60000,
    }
  }, [formattedFills, resolutionMs])

  const { data: ohlc } = useOHLC({
    instrument: `${remapToken(token.ticker)}_usdt`,
    startDateMs: startMs,
    endDateMs: endMs,
    timeInterval: "minutes",
  })

  const chartData = React.useMemo(() => {
    if (!ohlc) return []

    const ohlcStartTime = ohlc[0].time
    const ohlcEndTime = ohlc[ohlc.length - 1].time

    // Step 1: Convert price data to the desired resolution
    const adjustedPriceData: Partial<ChartData>[] = []
    let startTimestamp = Math.floor(startMs / resolutionMs) * resolutionMs
    for (let i = 0; i < ohlc.length; i++) {
      const bar = ohlc[i]
      const endTimestamp = bar.time + 60000 // Each bar is 1 minute
      while (startTimestamp < endTimestamp) {
        if (startTimestamp >= ohlcStartTime && startTimestamp < ohlcEndTime) {
          adjustedPriceData.push({
            timestamp: startTimestamp.toString(),
            price: order.data.side === "Sell" ? bar.low : bar.high,
          })
        }
        startTimestamp += resolutionMs
      }
    }

    // Step 2: Align fill data to the desired resolution
    // Aligned timestamp will never be greater than fill timestamp
    // Can be up to resolutionMs off
    const adjustedFillData = formattedFills.map(fillPoint => {
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
        f => f.timestamp.toString() === pricePoint.timestamp,
      ) || { volume: undefined, fillPrice: undefined }
      return {
        price: pricePoint.price,
        fillPrice: fillPoint.fillPrice,
        volume: fillPoint.volume,
        timestamp: pricePoint.timestamp,
      }
    })

    return result
  }, [formattedFills, startMs, ohlc, order.data.side, resolutionMs])

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
              dataKey="price"
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
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[200px]"
                  labelFormatter={value => {
                    return new Date(Number(value)).toLocaleDateString("en-US", {
                      day: "numeric",
                      hour: "numeric",
                      minute: "numeric",
                      second: "numeric",
                      month: "long",
                    })
                  }}
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
                              {formatPercentage(
                                order.data.side === "Buy"
                                  ? item.payload.price
                                  : item.payload.fillPrice,
                                order.data.side === "Buy"
                                  ? item.payload.fillPrice
                                  : item.payload.price,
                                2,
                                false,
                              )}
                              <span className="font-normal text-muted-foreground">
                                %
                              </span>
                            </div>
                          </div>
                        )}
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
            <div className="flex items-center gap-2 text-xs leading-none text-muted-foreground">
              Data by Ambderdata.
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}

function formatTimestamp(value: number): string {
  const date = new Date(Number(value))
  return date.toLocaleString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })
}

function isPositiveRelativeFill(
  fillPrice: number,
  price: number,
  side: "Buy" | "Sell",
): boolean {
  return side === "Buy" ? fillPrice < price : fillPrice > price
}
