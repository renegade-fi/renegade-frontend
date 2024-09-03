import { Bar } from "@renegade-fi/tradingview-charts"
import invariant from "tiny-invariant"

import { makeAmberApiRequest } from "@/app/trade/[base]/components/charts/tradingview/helpers"

import { oneDayMs, oneMonthMs, twelveMonthsMs } from "@/lib/constants/time"

const BASE_URL = "https://api.amberdata.com"

export async function fetchBars({
  instrument,
  startDateMs,
  endDateMs,
  timeInterval,
}: {
  instrument: string
  startDateMs: number
  endDateMs: number
  timeInterval: "minutes" | "hours" | "days"
}) {
  const url = new URL(`${BASE_URL}/markets/spot/ohlcv/${instrument}`)
  url.searchParams.set("exchange", "binance")
  url.searchParams.set("startDate", startDateMs.toString())
  url.searchParams.set("endDate", endDateMs.toString())
  url.searchParams.set("timeInterval", timeInterval)

  // Split the time range into chunks to avoid exceeding the API limit
  const chunkSizeInMs = timeIntervalToTimeRangeLimitMap[timeInterval]
  const chunks = []
  let currentFrom = startDateMs

  while (currentFrom < endDateMs) {
    const currentTo = Math.min(currentFrom + chunkSizeInMs, endDateMs)
    chunks.push({ from: currentFrom, to: currentTo })
    currentFrom = currentTo
  }

  const fetchPromises = chunks.map((chunk) => {
    const chunkUrl = new URL(url.toString())
    chunkUrl.searchParams.set("startDate", chunk.from.toString())
    chunkUrl.searchParams.set("endDate", chunk.to.toString())
    return makeAmberApiRequest(chunkUrl)
  })

  const responses = await Promise.all(fetchPromises)
  let bars: Bar[] = []
  for (const response of responses) {
    response.payload.data.map((res: any) => {
      const bar: Bar = {
        time: res.exchangeTimestamp,
        open: res.open,
        high: res.high,
        low: res.low,
        close: res.close,
        volume: res.volume,
      }
      bars.push(bar)
    })
  }
  return bars
}

const timeIntervalToTimeRangeLimitMap = {
  minutes: oneDayMs,
  hours: oneMonthMs,
  days: twelveMonthsMs,
} as const
