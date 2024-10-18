import { Token } from "@renegade-fi/react"
import { useQuery } from "@tanstack/react-query"

async function fetchCombinedBalances(address: `0x${string}`) {
  const response = await fetch(
    `/api/tokens/get-combined-balances?address=${address}`,
    {
      cache: "no-store",
    },
  )
  if (!response.ok) {
    throw new Error("Failed to fetch combined balances")
  }
  return response.json()
}

export function useCombinedBalances(address?: `0x${string}`) {
  const queryKey = ["combinedBalances", address]

  return {
    queryKey,
    ...useQuery<Map<`0x${string}`, bigint>, Error>({
      queryKey,
      queryFn: () => fetchCombinedBalances(address!),
      enabled: !!address,
      select: (data) =>
        Object.entries(data).reduce((acc, [key, value]) => {
          const address = Token.findByTicker(key).address
          acc.set(address, BigInt(value))
          return acc
        }, new Map<`0x${string}`, bigint>()),
    }),
  }
}
