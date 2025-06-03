import { useQuery } from "@tanstack/react-query"

export function useTvl(chainId: number) {
  const queryKey = ["stats", "tvl", chainId]
  return {
    ...useQuery<{ address: `0x${string}`; tvl: bigint }[], Error>({
      queryKey,
      queryFn: () => fetchTvlData(chainId),
      staleTime: Infinity,
    }),
    queryKey,
  }
}

const fetchTvlData = async (
  chainId: number,
): Promise<{ address: `0x${string}`; tvl: bigint }[]> => {
  const response = await fetch(`/api/stats/tvl?chainId=${chainId}`)
  if (!response.ok) {
    throw new Error("Failed to fetch TVL data")
  }
  const res = await response.json().then((res) =>
    res.data.map(
      ({ address, tvl }: { address: `0x${string}`; tvl: string }) => ({
        address,
        tvl: BigInt(tvl),
      }),
    ),
  )
  return res
}
