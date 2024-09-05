import { useQuery } from "@tanstack/react-query"

export function useTvl() {
  const queryKey = ["stats", "tvl"]
  return {
    ...useQuery<{ ticker: string; tvl: bigint }[], Error>({
      queryKey,
      queryFn: fetchTvlData,
      staleTime: Infinity,
    }),
    queryKey,
  }
}

const fetchTvlData = async (): Promise<{ ticker: string; tvl: bigint }[]> => {
  const response = await fetch("/api/stats/tvl")
  if (!response.ok) {
    throw new Error("Failed to fetch TVL data")
  }
  const res = await response.json().then((res) =>
    res.data.map(({ ticker, tvl }: { ticker: string; tvl: string }) => ({
      ticker,
      tvl: BigInt(tvl),
    })),
  )
  return res
}
