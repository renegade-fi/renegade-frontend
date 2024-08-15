import { Bar } from "@renegade-fi/tradingview-charts"

// Amberdata API URL
const BASE_URL = "https://api.amberdata.com"

// TODO: Remove because search is disabled
export async function getAllBinanceSymbols() {
  const data = await makeAmberApiRequest(
    new URL(`${BASE_URL}/market/spot/exchanges/reference?exchange=binance`),
  )
  let allSymbols = []

  const pairs = data.payload.data.binance
  for (const key of Object.keys(pairs)) {
    const pair = pairs[key]
    const base = pair.baseSymbol
    const quote = pair.quoteSymbol
    allSymbols.push({
      symbol: pair.nativePair,
      full_name: key,
      description: `${base}/${quote}`,
      exchange: "binance",
      type: "crypto",
    })
  }
  return allSymbols
}

export async function makeAmberApiRequest(url: URL) {
  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
      "x-api-key": process.env.NEXT_PUBLIC_AMBERDATA_API_KEY!,
    },
  }
  try {
    const response = await fetch(url.toString(), options)
    return response.json()
  } catch (error) {
    throw new Error(`Amber request error: ${error}`)
  }
}

export function formatBars(bars: any[]): Bar[] {
  if (!bars || bars.length === 0) {
    return []
  }
  return bars.map((bar) => ({
    time: bar[0],
    low: bar[3],
    high: bar[2],
    open: bar[1],
    close: bar[4],
  }))
}

export async function fetchSymbolReferenceInfo(pair: string) {
  try {
    const url = new URL(`${BASE_URL}/market/spot/exchanges/reference`)
    url.searchParams.set("exchange", "binance")
    url.searchParams.set("pair", pair)
    const res = await makeAmberApiRequest(url)
    if (res.status !== 200) {
      throw new Error(res.statusText)
    } else if (!res.payload.data.binance[pair]) {
      throw new Error(`Pair not found: ${pair}`)
    }
    return res.payload.data.binance[pair]
  } catch (error) {
    throw new Error(`Failed to fetch symbol reference info: ${error}`)
  }
}

/**
 * Fetches trading bars for a specified period, broken down into chunks to manage API limits.
 *
 * @param ticker The ticker symbol for the asset pair.
 * @param startTimeInMilliseconds The start time of the period for which bars are fetched, in milliseconds.
 * @param endTimeInMilliseconds The end time of the period for which bars are fetched, in milliseconds.
 * @param timeInterval The granularity of the time bars (e.g., '1m', '5m').
 * @param chunkSizeInSeconds The maximum size of each time chunk in seconds, to avoid exceeding API limits.
 * @returns An array of `Bar` objects representing the trading data.
 */
export async function fetchBarsForPeriod(
  ticker: string,
  startTimeMs: number,
  endTimeMs: number,
  timeInterval: string,
  chunkSizeInMs: number,
): Promise<Bar[]> {
  const url = new URL(`${BASE_URL}/market/spot/ohlcv/${ticker}/historical`)
  url.searchParams.set("exchange", "binance")
  url.searchParams.set("timeInterval", timeInterval)

  // Split the time range into chunks to avoid exceeding the API limit
  const chunks = []
  let currentFrom = startTimeMs

  while (currentFrom < endTimeMs) {
    const currentTo = Math.min(currentFrom + chunkSizeInMs, endTimeMs)
    chunks.push({ from: currentFrom, to: currentTo })
    currentFrom = currentTo
  }
  const validChunks = chunks.filter(
    (chunk) => chunk.to - chunk.from <= chunkSizeInMs,
  )

  const fetchPromises = chunks.map((chunk) => {
    const chunkUrl = new URL(url.toString())
    chunkUrl.searchParams.set("startDate", chunk.from.toString())
    chunkUrl.searchParams.set("endDate", chunk.to.toString())
    return makeAmberApiRequest(chunkUrl)
  })

  const responses = await Promise.all(fetchPromises)
  let bars: Bar[] = []
  responses.forEach((res) => {
    bars = bars.concat(formatBars(res.payload.data.binance))
  })

  if (bars.length === 0) {
    throw new Error("NoData")
  }

  bars.sort((a, b) => a.time - b.time)

  return bars
}
