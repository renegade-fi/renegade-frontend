import { useQuery } from "@tanstack/react-query"

export function useTvl() {
  const queryKey = ["stats", "tvl"]
  return {
    ...useQuery<{ address: `0x${string}`; tvl: bigint }[], Error>({
      queryKey,
      queryFn: fetchTvlData,
      staleTime: Infinity,
    }),
    queryKey,
  }
}

const fetchTvlData = async (): Promise<
  { address: `0x${string}`; tvl: bigint }[]
> => {
  const response = await fetch("/api/stats/tvl")
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
