import { useQuery } from "@tanstack/react-query"

import { BucketData } from "@/app/api/stats/constants"
import { ExternalTransferLogsResponse } from "@/app/api/stats/external-transfer-logs/route"

export function useExternalTransferLogs(intervalMs: number = 86400000) {
  const queryKey = ["stats", "externalTransferLogs", intervalMs]

  return {
    ...useQuery<BucketData[], Error>({
      queryKey,
      queryFn: () => fetchExternalTransferLogs(intervalMs),
      staleTime: Infinity,
    }),
    queryKey,
  }
}

const fetchExternalTransferLogs = async (
  intervalMs: number,
): Promise<BucketData[]> => {
  const response = await fetch(
    `/api/stats/external-transfer-logs?interval=${intervalMs}`,
  )
  if (!response.ok) {
    throw new Error("Failed to fetch external transfer logs")
  }
  const res = (await response.json()) as ExternalTransferLogsResponse
  return res.data
}
