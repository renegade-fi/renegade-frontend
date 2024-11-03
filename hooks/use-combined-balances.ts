import { Token } from "@renegade-fi/react"
import { useWallet } from "@solana/wallet-adapter-react"
import { useQuery } from "@tanstack/react-query"

async function fetchCombinedBalances(
  address: `0x${string}`,
  solanaAddress?: string,
) {
  const params = new URLSearchParams({
    address: address,
  })

  if (solanaAddress) {
    params.append("solanaAddress", solanaAddress)
  }

  const response = await fetch(
    `/api/tokens/get-combined-balances?${params.toString()}`,
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
  const { publicKey } = useWallet()
  const solanaAddress = publicKey?.toBase58()
  const queryKey = ["combinedBalances", address, solanaAddress]

  return {
    queryKey,
    ...useQuery<Map<`0x${string}`, bigint>, Error>({
      queryKey,
      queryFn: () => fetchCombinedBalances(address!, solanaAddress),
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
