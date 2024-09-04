"use client"

import React from "react"

import { Pie, PieChart } from "recharts"

import { useTvlData } from "@/app/stats/hooks/use-tvl-data"

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
import { DISPLAY_TOKENS } from "@/lib/token"

const tokenColors = {
  WBTC: "orange",
  WETH: "blue",
  BNB: "yellow",
  MATIC: "purple",
  LDO: "sky",
  USDC: "blue",
  USDT: "green",
  LINK: "blue",
  UNI: "pink",
  SUSHI: "rose",
  "1INCH": "cyan",
  AAVE: "purple",
  COMP: "green",
  MKR: "teal",
  REN: "red",
  MANA: "rose",
  ENS: "indigo",
  DYDX: "violet",
  CRV: "white",
  ARB: "sky",
  GMX: "purple",
  PENDLE: "white",
  PEPE: "green",
  ZRO: "gray",
  LPT: "green",
  GRT: "purple",
  XAI: "red",
  RDNT: "blue",
  ETHFI: "purple",
} as const

// Tailwind color palette
const tailwindColors = [
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
]

export function TvlChart() {
  const { cumulativeTvlUsd, tvlUsd } = useTvlData()

  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {}
    DISPLAY_TOKENS().forEach((token, i) => {
      const color =
        token.ticker in tokenColors
          ? `var(--color-${tokenColors[token.ticker as keyof typeof tokenColors]})`
          : `var(--color-${tailwindColors[i % tailwindColors.length]})`
      // const color = chartColors[i % chartColors.length]
      config[token.ticker] = {
        label: token.ticker,
        color: color,
      }
    })
    return config
  }, [])

  return (
    <Card className="rounded-none">
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
          <CardTitle className="font-serif text-4xl font-bold">
            {cumulativeTvlUsd ? (
              formatStat(cumulativeTvlUsd)
            ) : (
              <Skeleton className="h-10 w-40" />
            )}
          </CardTitle>
          <CardDescription>Total Value Locked</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer
          className="mx-auto aspect-square max-h-[250px]"
          config={chartConfig}
        >
          <PieChart>
            <ChartTooltip
              content={<ChartTooltipContent hideLabel />}
              cursor={false}
              formatter={(value, name, item, index) => {
                const n = formatStat(Number(value))
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
            />
            <Pie
              data={tvlUsd}
              dataKey="data"
              nameKey="name"
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
