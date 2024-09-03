import {
  Bar,
  IBasicDataFeed,
  LibrarySymbolInfo,
} from "@renegade-fi/tradingview-charts"

import {
  subscribeOnStream,
  unsubscribeFromStream,
} from "@/app/trade/[base]/components/charts/tradingview/streaming"

import { oneDayMs, oneMonthMs, twelveMonthsMs } from "@/lib/constants/time"

import { datafeedConfig } from "./config"
import {
  fetchBarsForPeriod,
  fetchSymbolReferenceInfo,
  getAllBinanceSymbols,
} from "./helpers"

const lastBarsCache = new Map()

export const datafeed = {
  onReady: (callback: any) => {
    setTimeout(() => callback(datafeedConfig))
  },
  searchSymbols: async (
    userInput,
    exchange,
    symbolType,
    onResultReadyCallback,
  ) => {
    const symbols = await getAllBinanceSymbols()
    const newSymbols = symbols.filter((symbol) => {
      const isExchangeValid = exchange === "" || symbol.exchange === exchange
      const isFullSymbolContainsInput =
        symbol.full_name.toLowerCase().indexOf(userInput.toLowerCase()) !== -1
      return isExchangeValid && isFullSymbolContainsInput
    })
    onResultReadyCallback(newSymbols)
  },
  resolveSymbol: async (
    symbolName,
    onSymbolResolvedCallback,
    onResolveErrorCallback,
    extension,
  ) => {
    try {
      const symbolItem = await fetchSymbolReferenceInfo(symbolName)
      const symbolInfo = {
        data_status: "streaming",
        description: `${symbolItem.nativePair}`,
        exchange: datafeedConfig.exchanges[0].name,
        format: "price",
        has_intraday: true,
        intraday_multipliers: ["1", "60"],
        has_daily: true,
        daily_multipliers: ["1"],
        has_weekly_and_monthly: false,
        listed_exchange: "",
        minmov: 1,
        name: `${symbolItem.nativePair}`,
        pricescale: 100,
        session: "24x7",
        supported_resolutions: datafeedConfig.supported_resolutions,
        ticker: `${symbolName}`,
        timezone: "Etc/UTC",
        type: "crypto",
        volume_precision: 2,
      } satisfies LibrarySymbolInfo

      onSymbolResolvedCallback(symbolInfo)
    } catch (error) {
      onResolveErrorCallback("cannot resolve symbol")
    }
  },
  async getBars(
    symbolInfo,
    resolution,
    periodParams,
    onHistoryCallback,
    onErrorCallback,
  ) {
    const { from, to, firstDataRequest } = periodParams

    try {
      const resolutionSettings: {
        [key: string]: { period: string; duration: number }
      } = {
        "1": { period: "minutes", duration: oneDayMs },
        "60": { period: "hours", duration: oneMonthMs },
        "1D": { period: "days", duration: twelveMonthsMs },
      }

      let bars: Bar[] = []
      const settings = resolutionSettings[resolution]
      if (settings && symbolInfo.ticker) {
        bars = await fetchBarsForPeriod(
          symbolInfo.ticker,
          from * 1000,
          to * 1000,
          settings.period,
          settings.duration,
        )
      } else {
        throw new Error(
          `Missing ticker (${symbolInfo.ticker}) or resolution (${resolution})`,
        )
      }

      // Caching
      if (firstDataRequest) {
        lastBarsCache.set(symbolInfo.name, {
          ...bars[bars.length - 1],
        })
      }

      onHistoryCallback(bars, {
        noData: false,
      })
    } catch (error) {
      if (error === "NoData") {
        onHistoryCallback([], {
          noData: true,
        })
      } else {
        onErrorCallback(`${error}`)
      }
    }
  },
  subscribeBars: (
    symbolInfo,
    resolution,
    onRealtimeCallback,
    subscriberUID,
    onResetCacheNeededCallback,
  ) => {
    subscribeOnStream(
      symbolInfo,
      resolution,
      onRealtimeCallback,
      subscriberUID,
      onResetCacheNeededCallback,
      lastBarsCache.get(symbolInfo.name),
    )
  },

  unsubscribeBars: (subscriberUID) => {
    unsubscribeFromStream(subscriberUID)
  },
} satisfies IBasicDataFeed
