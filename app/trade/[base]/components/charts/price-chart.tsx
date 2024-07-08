import { useState } from 'react'

import dynamic from 'next/dynamic'
import Script from 'next/script'

import { remapToken } from '@/lib/token'
import {
  ChartingLibraryWidgetOptions,
  ResolutionString,
} from '@renegade-fi/tradingview-charts'

import { config } from './tradingview/config'

const TradingViewChart = dynamic(() => import('./tradingview'), { ssr: false })

export function PriceChart({ base }: { base: string }) {
  const [isScriptReady, setIsScriptReady] = useState(false)

  const defaultWidgetProps: Partial<ChartingLibraryWidgetOptions> = {
    symbol: `${remapToken(base)}_usdt`,
    ...config,
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
      {isScriptReady && <TradingViewChart {...defaultWidgetProps} />}
    </>
  )
}
