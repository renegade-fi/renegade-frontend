import { oneDayMs } from '@/lib/constants/time'
import { remapToken } from '@/lib/token'
import { Bar } from '@renegade-fi/tradingview-charts'
import { useQuery, UseQueryResult } from '@tanstack/react-query'

import { fetchBarsForPeriod } from '@/app/trade/[base]/components/charts/tradingview/helpers'

export function useOHLC(
  pair: string,
  from: number,
  to: number,
  interval: string = 'hours',
): UseQueryResult<Bar[], unknown> {
  return useQuery({
    queryKey: ['ohlc', pair, from, to],
    queryFn: () => fetchOHLC(pair, from, to, interval),
    retry: false,
  })
}

function fetchOHLC(base: string, from: number, to: number, interval: string) {
  return fetchBarsForPeriod(
    `${remapToken(base)}_usdt`,
    from,
    to,
    'minutes',
    oneDayMs,
  )
}
