import { Bar } from "@/lib/charts"
import { useQuery, UseQueryResult } from "@tanstack/react-query"

import { fetchBars } from "@/lib/amberdata"

export function useOHLC(options: {
  instrument: string
  startDateMs: number
  endDateMs: number
  timeInterval: "minutes" | "hours" | "days"
}): UseQueryResult<Bar[], unknown> {
  return useQuery({
    queryKey: ["ohlc", options],
    queryFn: () =>
      fetchBars({
        instrument: options.instrument,
        startDateMs: options.startDateMs,
        endDateMs: options.endDateMs,
        timeInterval: options.timeInterval,
      }),
    retry: false,
  })
}
