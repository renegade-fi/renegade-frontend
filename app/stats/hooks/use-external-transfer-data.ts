import { useQuery } from "@tanstack/react-query"

import { BucketData } from "@/app/api/stats/constants"
import { ExternalTransferLogsResponse } from "@/app/api/stats/external-transfer-logs/route"

import { env } from "@/env/client"

export function useExternalTransferLogs({
  intervalMs = 86400000,
  chainId,
}: {
  intervalMs?: number
  chainId: number
}) {
  const queryKey = ["stats", "externalTransferLogs", intervalMs, chainId]

  return {
    ...useQuery<BucketData[], Error>({
      queryKey,
      queryFn: () => fetchExternalTransferLogs(intervalMs, chainId),
      staleTime: Infinity,
      enabled: env.NEXT_PUBLIC_CHAIN_ENVIRONMENT === "mainnet",
    }),
    queryKey,
  }
}

const fetchExternalTransferLogs = async (
  intervalMs: number,
  chainId: number,
): Promise<BucketData[]> => {
  const response = await fetch(
    `/api/stats/external-transfer-logs?interval=${intervalMs}&chainId=${chainId}`,
  )
  if (!response.ok) {
    throw new Error("Failed to fetch external transfer logs")
  }
  const res = (await response.json()) as ExternalTransferLogsResponse
  return res.data
}
