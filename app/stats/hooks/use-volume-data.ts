import { useQuery, UseQueryResult } from "@tanstack/react-query"

import type {
  HistoricalVolumeResponse,
  VolumeDataPoint,
} from "@/app/api/stats/historical-volume-kv/route"

type UseHistoricalVolumeResult = UseQueryResult<VolumeDataPoint[], Error> & {
  queryKey: readonly ["stats", "historical-volume"]
}

/**
 * Hook to fetch all historical volume data.
 */
export function useVolumeData(): UseHistoricalVolumeResult {
  const queryKey = ["stats", "historical-volume"] as const

  return {
    ...useQuery<VolumeDataPoint[], Error>({
      queryKey,
      queryFn: getHistoricalVolume,
      staleTime: Infinity,
    }),
    queryKey,
  }
}

export async function getHistoricalVolume(): Promise<VolumeDataPoint[]> {
  const res = await fetch("/api/stats/historical-volume-kv", {
    cache: "no-store",
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch historical volume data: ${res.statusText}`)
  }

  const data: HistoricalVolumeResponse = await res.json()

  // Filter data for entries after 1725321600
  return data.data.filter((point) => point.timestamp >= 1725321600)
}
