import React from "react"

import {
  ChartingLibraryWidgetOptions,
  LanguageCode,
  ResolutionString,
  widget,
} from "@renegade-fi/tradingview-charts"

import { config } from "@/app/trade/[base]/components/charts/tradingview/config"

import { datafeed } from "./datafeed"

export default function TradingViewChart(
  props: Partial<ChartingLibraryWidgetOptions>,
) {
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
    return () => {
      tvWidget.remove()
    }
  }, [props])

  return (
    <div
      className="h-[500px]"
      ref={chartContainerRef}
    />
  )
}
