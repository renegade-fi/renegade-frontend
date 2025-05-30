import React from "react"

import { OrderMetadata } from "@renegade-fi/react"
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
import { oneMinute } from "@/lib/constants/time"
import { formatCurrency, formatNumber, formatPercentage } from "@/lib/format"
import { remapToken, resolveAddress } from "@/lib/token"
import { decimalNormalizePrice } from "@/lib/utils"

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
  const lowerBound = minValue - padding
  const upperBound = maxValue + padding
  if (minValue < 10) {
    return [lowerBound, upperBound]
  }
  return [Math.floor(lowerBound), Math.ceil(upperBound)]
}

export function FillChart({ order }: { order: OrderMetadata }) {
  const token = resolveAddress(order.data.base_mint)
  const quoteToken = resolveAddress(order.data.quote_mint)

  const formattedFills = order.fills
    .map((fill) => ({
      timestamp: Number(fill.price.timestamp),
      amount: Number(formatNumber(fill.amount, token.decimals)),
      price: Number(
        decimalNormalizePrice(
          fill.price.price,
          token.decimals,
          quoteToken.decimals,
        ),
      ),
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

    const paddingMs = oneMinute * 30

    let startTime = 0
    let endTime = 0

    if (formattedFills.length === 1) {
      startTime = minFillTimestamp - paddingMs
      endTime = maxFillTimestamp + paddingMs
    } else {
      startTime = minFillTimestamp - paddingMs
      endTime = maxFillTimestamp + paddingMs
    }
    // Round to nearest minute
    return {
      startMs: Math.floor(startTime / 60000) * 60000,
      endMs: Math.ceil(endTime / 60000) * 60000,
    }
  }, [formattedFills])

  const { data: ohlc } = useOHLC({
    instrument: `${remapToken(token.ticker)}_usdt`,
    startDateMs: startMs,
    endDateMs: endMs,
    timeInterval: "minutes",
  })

  const chartData = React.useMemo(() => {
    if (!ohlc || !ohlc.length) return []

    if (formattedFills.length === 1) {
      const fills = formattedFills.map((fill) => {
        const adjustedTimestamp = Math.floor(fill.timestamp / 60000) * 60000
        const currentBar = ohlc.find((bar) => bar.time === adjustedTimestamp)
        const bar = currentBar ? currentBar : ohlc[ohlc.length - 1]

        return {
          timestamp: fill.timestamp.toString(),
          fillPrice: fill.price,
          price: order.data.side === "Sell" ? bar?.low : bar?.high,
        }
      })

      const prices = ohlc.map((bar) => {
        return {
          timestamp: bar.time.toString(),
          price: bar.close,
          fillPrice: undefined,
        }
      })

      return [...fills, ...prices].sort(
        (a, b) => Number(a.timestamp) - Number(b.timestamp),
      )
    }

    const fills = formattedFills.map((fill) => {
      const adjustedTimestamp = Math.floor(fill.timestamp / 60000) * 60000
      const currentBar = ohlc.find((bar) => bar.time === adjustedTimestamp)
      const bar = currentBar ? currentBar : ohlc[ohlc.length - 1]
      return {
        timestamp: fill.timestamp.toString(),
        fillPrice: fill.price,
        price: order.data.side === "Sell" ? bar?.low : bar?.high,
      }
    })

    const prices = ohlc.map((bar) => {
      return {
        timestamp: bar.time.toString(),
        price: order.data.side === "Sell" ? bar.low : bar.high,
        fillPrice: undefined,
      }
    })

    const result = [...fills, ...prices].sort(
      (a, b) => Number(a.timestamp) - Number(b.timestamp),
    )
    const targetPoints = 150
    const sampleRate = Math.floor(result.length / targetPoints)
    if (sampleRate < 1) {
      return result
    }
    const sampledResult = result.filter(
      (v, index) => index % sampleRate === 0 || v.fillPrice,
    )

    return sampledResult
  }, [formattedFills, ohlc, order.data.side])

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
              tickFormatter={formatCurrency}
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
              cursor
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
                  labelFormatter={(value) => {
                    return new Date(Number(value)).toLocaleDateString("en-US", {
                      day: "numeric",
                      hour: "numeric",
                      minute: "numeric",
                      second: "numeric",
                      month: "long",
                    })
                  }}
                />
              }
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
