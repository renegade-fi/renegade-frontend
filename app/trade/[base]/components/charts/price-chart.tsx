import Script from "next/script"

import { ChartingLibraryWidgetOptions } from "@renegade-fi/tradingview-charts"

import TradingViewChart from "@/app/trade/[base]/components/charts/tradingview"

import { resolveTicker } from "@/lib/token"

export function PriceChart({ baseTicker }: { baseTicker: string }) {
  const defaultWidgetProps: Partial<ChartingLibraryWidgetOptions> = {
    symbol: resolveTicker(baseTicker).address,
  }
  return (
    <>
      <Script
        src="/static/datafeeds/udf/dist/bundle.js"
        strategy="afterInteractive"
      />
      <div className="relative h-[400px] lg:h-[500px]">
        <TradingViewChart {...defaultWidgetProps} />
      </div>
    </>
  )
}
