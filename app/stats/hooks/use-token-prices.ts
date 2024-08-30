import { useQuery } from "@tanstack/react-query"

interface TokenPricesApiResponse {
  data: { ticker: string; price: number }[]
}

export function useTokenPrices() {
  const queryKey = ["stats", "tokenPrices"]
  return {
    ...useQuery<{ ticker: string; price: number }[], Error>({
      queryKey,
      queryFn: fetchTokenPrices,
      staleTime: Infinity,
    }),
    queryKey,
  }
}

const fetchTokenPrices = async (): Promise<
  { ticker: string; price: number }[]
> => {
  const response = await fetch("/api/amberdata/token-prices", {
    cache: "no-cache",
  })
  if (!response.ok) {
    throw new Error("Failed to fetch token prices")
  }
  const { data }: TokenPricesApiResponse = await response.json()
  return data
}
