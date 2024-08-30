import React from "react"

import Image from "next/image"

import {
  ChartingLibraryWidgetOptions,
  LanguageCode,
  ResolutionString,
  widget,
} from "@renegade-fi/tradingview-charts"

import { config } from "@/app/trade/[base]/components/charts/tradingview/config"

import { cn } from "@/lib/utils"

import { datafeed } from "./datafeed"

export default function TradingViewChart(
  props: Partial<ChartingLibraryWidgetOptions>,
) {
  const [isReady, setIsReady] = React.useState(false)
  const chartContainerRef =
    React.useRef<HTMLDivElement>() as React.MutableRefObject<HTMLInputElement>

  React.useEffect(() => {
    const widgetOptions: ChartingLibraryWidgetOptions = {
      container: chartContainerRef.current,
      datafeed,
      interval: props.interval as ResolutionString,
      locale: props.locale as LanguageCode,
      symbol: props.symbol,
      ...config,
    }

    const tvWidget = new widget(widgetOptions)
    if (tvWidget) {
      tvWidget.onChartReady(() => {
        setIsReady(true)
      })
    }
    return () => {
      tvWidget.remove()
    }
  }, [props])

  return (
    <>
      <div
        className={cn("h-[500px]", isReady ? "visible" : "hidden")}
        ref={chartContainerRef}
      />
      <div
        className={cn("relative min-h-[500px]", isReady ? "hidden" : "visible")}
      >
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <Image
            className="animate-pulse"
            src="/glyph_dark.svg"
            alt="logo"
            width="46"
            height="57"
            priority
          />
        </div>
      </div>
    </>
  )
}
