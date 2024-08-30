import { useQuery, UseQueryResult } from "@tanstack/react-query"

interface VolumeParams {
  from: number
  to?: number
}

interface VolumeDataPoint {
  timestamp: string
  volume: number
}

type UseCumulativeVolumeResult = UseQueryResult<VolumeDataPoint[], Error> & {
  queryKey: readonly [
    "stats",
    "cumulative-volume",
    { from: number; to: number },
  ]
}

/**
 * Hook to fetch volume data.
 * @param params - Object containing 'from' (required) and 'to' (optional) timestamps in seconds.
 * Note: 'from' and 'to' must be Unix timestamps in seconds, not milliseconds.
 */
export function useCumulativeVolume({
  from,
  to,
}: VolumeParams): UseCumulativeVolumeResult {
  const now = Math.floor(Date.now() / 1000)
  const finalTo = to ?? now

  const queryKey = [
    "stats",
    "cumulative-volume",
    { from, to: finalTo },
  ] as const

  return {
    ...useQuery<VolumeDataPoint[], Error>({
      queryKey,
      queryFn: () => getCumulativeVolume({ from, to: finalTo }),
      staleTime: Infinity,
    }),
    queryKey,
  }
}

export async function getCumulativeVolume({ from, to }: VolumeParams) {
  const searchParams = new URLSearchParams()
  searchParams.append("from", from.toString())
  if (to) searchParams.append("to", to.toString())

  const url = `/api/stats/cumulative-volume?${searchParams.toString()}`
  const res = await fetch(url, { cache: "force-cache" }).then((res) =>
    res.json(),
  )
  if (res.error) {
    throw new Error(res.error)
  }
  return res.data.map((item: [number, number]) => ({
    timestamp: item[0].toString(),
    volume: item[1],
  }))
}
