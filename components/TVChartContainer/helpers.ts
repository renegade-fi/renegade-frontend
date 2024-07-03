import { Bar } from '@renegade-fi/tradingview-charts'

// TODO: We don't actually use this function because searching is disabled, chart always shows current asset
export async function getAllBinanceSymbols() {
  // TODO: Only fetches 500 at a time, need to figure out pagination or filter more strictly
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
      exchange: 'binance',
      type: 'crypto',
    })
  }
  return allSymbols
}

export const BASE_URL = 'https://api.amberdata.com'

export async function makeAmberApiRequest(url: URL) {
  const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      'x-api-key': process.env.NEXT_PUBLIC_AMBERDATA_API_KEY!,
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
  return bars.map(bar => ({
    time: bar[0],
    low: bar[3],
    high: bar[2],
    open: bar[1],
    close: bar[4],
  }))
}

export async function fetchBarsForPeriod(
  url: URL,
  from: number,
  to: number,
  timeInterval: string,
  chunkSizeInSeconds: number,
): Promise<Bar[]> {
  url.searchParams.set('timeInterval', timeInterval)

  // Split the time range into chunks to avoid exceeding the API limit
  const chunks = []
  let currentFrom = from

  while (currentFrom < to) {
    const currentTo = Math.min(currentFrom + chunkSizeInSeconds, to)
    chunks.push({ from: currentFrom, to: currentTo })
    currentFrom = currentTo
  }

  const fetchPromises = chunks.map(chunk => {
    const chunkUrl = new URL(url.toString()) // Clone the URL to avoid mutation across requests
    chunkUrl.searchParams.set('startDate', chunk.from.toString())
    chunkUrl.searchParams.set('endDate', chunk.to.toString())
    return makeAmberApiRequest(chunkUrl)
  })

  const responses = await Promise.all(fetchPromises)
  let bars: Bar[] = []
  responses.forEach(res => {
    bars = bars.concat(formatBars(res.payload.data.binance))
  })

  if (bars.length === 0) {
    throw new Error('NoData')
  }

  // Sort bars by timestamp in ascending order
  bars.sort((a, b) => a.time - b.time)

  return bars
}
