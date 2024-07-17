import { useEffect, useRef } from "react"

import {
  ChartingLibraryWidgetOptions,
  LanguageCode,
  ResolutionString,
  widget,
} from "@renegade-fi/tradingview-charts"

import { datafeed } from "./datafeed"

export default function TradingViewChart(
  props: Partial<ChartingLibraryWidgetOptions>,
) {
  const chartContainerRef =
    useRef<HTMLDivElement>() as React.MutableRefObject<HTMLInputElement>

  useEffect(() => {
    const widgetOptions: ChartingLibraryWidgetOptions = {
      container: chartContainerRef.current,
      datafeed,
      interval: props.interval as ResolutionString,
      locale: props.locale as LanguageCode,
      ...props,
    }

    const tvWidget = new widget(widgetOptions)
    return () => {
      tvWidget.remove()
    }
  }, [props])

  return <div className="h-[500px]" ref={chartContainerRef} />
}
