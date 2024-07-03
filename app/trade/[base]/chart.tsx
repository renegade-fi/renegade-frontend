import { useState } from 'react'

import dynamic from 'next/dynamic'
import Script from 'next/script'

import { remapToken } from '@/lib/token'
import {
  ChartingLibraryWidgetOptions,
  ResolutionString,
} from '@renegade-fi/tradingview-charts'

const TVChartContainer = dynamic(
  () =>
    import('@/components/TVChartContainer').then(mod => mod.TVChartContainer),
  { ssr: false },
)

export function Chart({ base }: { base: string }) {
  const [isScriptReady, setIsScriptReady] = useState(false)

  const defaultWidgetProps: Partial<ChartingLibraryWidgetOptions> = {
    symbol: `${remapToken(base)}_usdt`,
    interval: '1D' as ResolutionString,
    library_path: '/static/charting_library/',
    locale: 'en',
    charts_storage_url: 'https://saveload.tradingview.com',
    charts_storage_api_version: '1.1',
    client_id: 'tradingview.com',
    user_id: 'public_user_id',
    fullscreen: false,
    autosize: true,
    debug: true,
    custom_css_url: './theme.css',
  }
  return (
    <>
      <Script
        src="/static/datafeeds/udf/dist/bundle.js"
        strategy="afterInteractive"
        onReady={() => {
          setIsScriptReady(true)
        }}
      />
      {isScriptReady && <TVChartContainer {...defaultWidgetProps} />}
    </>
  )
}
