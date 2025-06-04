import { useQuery, UseQueryResult } from "@tanstack/react-query"

import type {
  HistoricalVolumeResponse,
  VolumeDataPoint,
} from "@/app/api/stats/historical-volume-kv/route"

import { env } from "@/env/client"

type UseHistoricalVolumeResult = UseQueryResult<VolumeDataPoint[], Error> & {
  queryKey: readonly ["stats", "historical-volume", number]
}

/**
 * Hook to fetch all historical volume data.
 */
export function useVolumeData(chainId: number): UseHistoricalVolumeResult {
  const queryKey = ["stats", "historical-volume", chainId] as const

  return {
    ...useQuery<VolumeDataPoint[], Error>({
      queryKey,
      queryFn: () => getHistoricalVolume(chainId),
      staleTime: Infinity,
      enabled: env.NEXT_PUBLIC_CHAIN_ENVIRONMENT === "mainnet",
    }),
    queryKey,
  }
}

export async function getHistoricalVolume(
  chainId: number,
): Promise<VolumeDataPoint[]> {
  const res = await fetch(`/api/stats/historical-volume-kv?chainId=${chainId}`)

  if (!res.ok) {
    throw new Error(`Failed to fetch historical volume data: ${res.statusText}`)
  }

  const data: HistoricalVolumeResponse = await res.json()

  // Filter data for entries after 1725321600
  return data.data.filter((point) => point.timestamp >= 1725321600)
}
