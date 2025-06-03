import Script from "next/script"

import { ChartingLibraryWidgetOptions } from "@renegade-fi/tradingview-charts"

import TradingViewChart from "@/app/trade/[base]/components/charts/tradingview"

export function PriceChart({ base }: { base: `0x${string}` }) {
  const defaultWidgetProps: Partial<ChartingLibraryWidgetOptions> = {
    symbol: base,
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
