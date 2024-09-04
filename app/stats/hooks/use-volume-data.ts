import { useQuery, UseQueryResult } from "@tanstack/react-query"
import type { HistoricalVolumeResponse, VolumeDataPoint } from '@/app/api/stats/get-historical-volume/route'

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
  const url = `/api/stats/get-historical-volume`
  const res = await fetch(url, {
    cache: "force-cache",
    next: { revalidate: 3600 },
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch historical volume data: ${res.statusText}`)
  }

  const data: HistoricalVolumeResponse = await res.json()
  return data.data
}
