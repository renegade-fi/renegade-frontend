import {
  Bar,
  IBasicDataFeed,
  LibrarySymbolInfo,
} from '@renegade-fi/tradingview-charts'

import { config } from '@/components/TVChartContainer/config'

import {
  BASE_URL,
  fetchBarsForPeriod,
  getAllBinanceSymbols,
  makeAmberApiRequest,
} from './helpers'

const oneDayInSeconds = 24 * 60 * 60
const oneMonthInSeconds = 30 * oneDayInSeconds
const twelveMonthsInSeconds = 12 * oneMonthInSeconds

const lastBarsCache = new Map()

export default {
  onReady: (callback: any) => {
    console.log('[onReady]: Method call')
    setTimeout(() => callback(config))
  },
  searchSymbols: async (
    userInput,
    exchange,
    symbolType,
    onResultReadyCallback,
  ) => {
    console.log('[searchSymbols]: Method call')
    const symbols = await getAllBinanceSymbols()
    const newSymbols = symbols.filter(symbol => {
      const isExchangeValid = exchange === '' || symbol.exchange === exchange
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
    console.log('[resolveSymbol]: Method call', symbolName)

    // Fills
    if (symbolName.endsWith('_fills')) {
      const symbolNameWithoutFills = symbolName.replace('_fills', '')
      const url = new URL(
        `${BASE_URL}/market/spot/exchanges/reference?exchange=binance&pair=${symbolNameWithoutFills}`,
      )
      const res = await makeAmberApiRequest(url)
      console.log('🚀 ~ res:', res)
      if (res.status !== 200 || res.payload.data.binance?.length === 0) {
        console.log('[resolveSymbol]: Cannot resolve symbol', symbolName)
        onResolveErrorCallback('cannot resolve symbol')
        return
      }
      const symbolItem = res.payload.data?.binance[symbolNameWithoutFills]
      const symbolInfo = {
        data_status: 'streaming',
        description: `${symbolItem.nativePair}`,
        exchange: 'RENEGADE',
        format: 'price',
        has_intraday: true,
        intraday_multipliers: ['1', '60'],
        has_daily: true,
        daily_multipliers: ['1'],
        has_weekly_and_monthly: false,
        listed_exchange: '',
        minmov: 1,
        name: `${symbolItem.nativePair} fills on Renegade`,
        pricescale: 100,
        session: '24x7',
        supported_resolutions: config.supported_resolutions,
        ticker: `${symbolName}`,
        timezone: 'Etc/UTC',
        type: 'crypto',
        volume_precision: 2,
      } satisfies LibrarySymbolInfo

      console.log('[resolveSymbol]: Symbol resolved', symbolName)
      onSymbolResolvedCallback(symbolInfo)
    }

    const url = new URL(
      `${BASE_URL}/market/spot/exchanges/reference?exchange=binance&pair=${symbolName}`,
    )
    const res = await makeAmberApiRequest(url)
    if (res.status !== 200 || res.payload.data.binance?.length === 0) {
      console.log('[resolveSymbol]: Cannot resolve symbol', symbolName)
      onResolveErrorCallback('cannot resolve symbol')
      return
    }
    const symbolItem = res.payload.data?.binance[symbolName]
    const symbolInfo = {
      data_status: 'streaming',
      description: `${symbolItem.nativePair}`,
      exchange: 'BINANCE',
      format: 'price',
      has_intraday: true,
      intraday_multipliers: ['1', '60'],
      has_daily: true,
      daily_multipliers: ['1'],
      has_weekly_and_monthly: false,
      listed_exchange: '',
      minmov: 1,
      name: `${symbolItem.nativePair}`,
      pricescale: 100,
      session: '24x7',
      supported_resolutions: config.supported_resolutions,
      ticker: `${symbolName}`,
      timezone: 'Etc/UTC',
      type: 'crypto',
      volume_precision: 2,
    } satisfies LibrarySymbolInfo

    console.log('[resolveSymbol]: Symbol resolved', symbolName)
    onSymbolResolvedCallback(symbolInfo)
  },
  async getBars(
    symbolInfo,
    resolution,
    periodParams,
    onHistoryCallback,
    onErrorCallback,
  ) {
    const { from, to, firstDataRequest } = periodParams
    console.log(
      '[getBars]: Method call',
      symbolInfo,
      resolution,
      from,
      to,
      periodParams,
    )

    try {
      const url = new URL(
        `${BASE_URL}/market/spot/ohlcv/${symbolInfo.ticker}/historical`,
      )
      url.searchParams.set('exchange', 'binance')

      // Define a mapping from resolution to period and duration
      const resolutionSettings: {
        [key: string]: { period: string; duration: number }
      } = {
        '1': { period: 'minutes', duration: oneDayInSeconds },
        '60': { period: 'hours', duration: oneMonthInSeconds },
        '1D': { period: 'days', duration: twelveMonthsInSeconds },
      }

      let bars: Bar[] = []
      const settings = resolutionSettings[resolution]
      if (settings) {
        bars = await fetchBarsForPeriod(
          url,
          from,
          to,
          settings.period,
          settings.duration,
        )
      } else {
        throw new Error(`Unsupported resolution: ${resolution}`)
      }

      // Caching
      if (firstDataRequest) {
        lastBarsCache.set(symbolInfo.name, {
          ...bars[bars.length - 1],
        })
      }
      console.log(`[getBars]: returned ${bars.length} bar(s)`)

      onHistoryCallback(bars, {
        noData: false,
      })
    } catch (error) {
      console.log('[getBars]: Get error', error)
      if (error === 'NoData') {
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
    console.log(
      '[subscribeBars]: Method call with subscriberUID:',
      subscriberUID,
    )
    // subscribeOnStream(
    //   symbolInfo,
    //   resolution,
    //   onRealtimeCallback,
    //   subscriberUID,
    //   onResetCacheNeededCallback,
    //   lastBarsCache.get(symbolInfo.full_name)
    // );
  },

  unsubscribeBars: subscriberUID => {
    console.log(
      '[unsubscribeBars]: Method call with subscriberUID:',
      subscriberUID,
    )
    // unsubscribeFromStream(subscriberUID);
  },
} satisfies IBasicDataFeed
