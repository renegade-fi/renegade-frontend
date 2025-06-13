import { Bar } from "@renegade-fi/tradingview-charts"

import { exchangeToAmberdataExchange } from "@/lib/amberdata"

// Amberdata API URL
const BASE_URL = "https://api.amberdata.com"

export async function makeAmberApiRequest(url: URL, options?: RequestInit) {
  const proxyUrl = new URL("/api/proxy/amberdata", window.location.origin)
  proxyUrl.searchParams.set("path", url.pathname + url.search)

  try {
    const response = await fetch(proxyUrl.toString(), options)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
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
    time: bar.exchangeTimestamp,
    low: bar.low,
    high: bar.high,
    open: bar.open,
    close: bar.close,
  }))
}

const TWO_YEARS_MS = 2 * 365 * 24 * 60 * 60 * 1000
const MAX_PARALLEL_REQUESTS = 1

/**
 * Recursive function to fetch bars, handling pagination and time range splitting.
 */
export async function fetchBarsForPeriod(
  ticker: string,
  exchange: string,
  startTimeMs: number,
  endTimeMs: number,
  timeInterval: string,
  countBack: number,
): Promise<Bar[]> {
  // Reduce startTimeMs by 10% to ensure we fetch enough bars
  const adjustedStartTimeMs = startTimeMs - (endTimeMs - startTimeMs) * 0.1

  const timeChunks = splitTimeRange(
    adjustedStartTimeMs,
    endTimeMs,
    MAX_PARALLEL_REQUESTS,
  )

  const amberdataExchange = exchangeToAmberdataExchange(exchange)

  const allBarsPromises = timeChunks.map((chunk) =>
    fetchBarsForTimeChunk(
      ticker,
      amberdataExchange,
      chunk.start,
      chunk.end,
      timeInterval,
      countBack,
    ),
  )

  const allBarsArrays = await Promise.all(allBarsPromises)
  const allBars = allBarsArrays.flat()

  // Sort and deduplicate bars
  const uniqueBars = Array.from(
    new Map(allBars.map((bar) => [bar.time, bar])).values(),
  ).sort((a, b) => a.time - b.time)

  if (uniqueBars.length < countBack) {
    console.warn(
      `Not enough bars fetched: ${uniqueBars.length}, requested ${countBack}`,
    )
  }
  return uniqueBars
}

/**
 * Fetches bars for a specific time chunk, handling cases where the chunk is larger than 2 years.
 */
async function fetchBarsForTimeChunk(
  ticker: string,
  exchange: string,
  startTimeMs: number,
  endTimeMs: number,
  timeInterval: string,
  countBack: number,
): Promise<Bar[]> {
  const timeDiff = endTimeMs - startTimeMs

  if (startTimeMs <= 0) {
    console.warn("Requested bars are before Unix epoch")
    return []
  } else if (timeDiff <= TWO_YEARS_MS) {
    return fetchBarsForTwoYearsOrLess(
      ticker,
      exchange,
      startTimeMs,
      endTimeMs,
      timeInterval,
      countBack,
    )
  } else {
    const midTimeMs = startTimeMs + Math.floor(timeDiff / 2)
    const [firstHalf, secondHalf] = await Promise.all([
      fetchBarsForTimeChunk(
        ticker,
        exchange,
        startTimeMs,
        midTimeMs,
        timeInterval,
        countBack,
      ),
      fetchBarsForTimeChunk(
        ticker,
        exchange,
        midTimeMs,
        endTimeMs,
        timeInterval,
        countBack,
      ),
    ])
    return [...firstHalf, ...secondHalf]
  }
}

/**
 * Helper function to fetch trading bars for periods of 2 years or less.
 * @param ticker The ticker symbol for the asset pair.
 * @param startTimeMs Unix timestamp (leftmost requested bar), in milliseconds.
 * @param endTimeMs Unix timestamp (rightmost requested bar), in milliseconds.
 * @param timeInterval The granularity of the time bars (e.g., '1m', '5m').
 * @param countBack The exact amount of bars to load.
 * @returns A promise that resolves to an array of Bar objects.
 */
async function fetchBarsForTwoYearsOrLess(
  ticker: string,
  exchange: string,
  startTimeMs: number,
  endTimeMs: number,
  timeInterval: string,
  countBack: number,
): Promise<Bar[]> {
  const url = new URL(`${BASE_URL}/markets/spot/ohlcv/${ticker}`)
  url.searchParams.set("exchange", exchange)
  url.searchParams.set("timeInterval", timeInterval)
  url.searchParams.set("startDate", new Date(startTimeMs).toISOString())
  url.searchParams.set("endDate", new Date(endTimeMs).toISOString())

  const allBars: Bar[] = []
  let nextUrl: string | null = url.toString()

  while (nextUrl && allBars.length < countBack) {
    const response = await makeAmberApiRequest(new URL(nextUrl), {
      cache: "force-cache",
    })

    if (!response.payload || !Array.isArray(response.payload.data)) {
      throw new Error("Invalid response from Amber API")
    }

    const newBars = formatBars(response.payload.data)
    allBars.push(...newBars)
    nextUrl = response.payload.metadata?.next || null

    // Break the loop if we've reached or exceeded the end time
    if (newBars.length > 0 && newBars[newBars.length - 1].time >= endTimeMs) {
      break
    }
  }

  return allBars
}

/**
 * Splits a time range into smaller chunks for parallel processing.
 * @param startTimeMs The start time in milliseconds.
 * @param endTimeMs The end time in milliseconds.
 * @param maxChunks The maximum number of chunks to create.
 * @returns An array of time chunks, each with a start and end time.
 */
function splitTimeRange(
  startTimeMs: number,
  endTimeMs: number,
  maxChunks: number,
) {
  const totalDuration = endTimeMs - startTimeMs
  const chunkSize = Math.ceil(totalDuration / maxChunks)
  const chunks = []

  for (let i = 0; i < maxChunks; i++) {
    const chunkStart = startTimeMs + i * chunkSize
    const chunkEnd = Math.min(chunkStart + chunkSize, endTimeMs)
    chunks.push({ start: chunkStart, end: chunkEnd })
    if (chunkEnd === endTimeMs) break
  }

  return chunks
}
