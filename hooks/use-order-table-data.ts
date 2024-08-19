import { Token, useOrderHistory } from "@renegade-fi/react"

import { usePrice } from "@/stores/price-store"

export function useOrderTableData() {
  const { data } = useOrderHistory({
    query: {
      select: (data) => Array.from(data?.values() || []),
    },
  })
  // Subscribe to USDC price
  usePrice({
    baseAddress: Token.findByTicker("USDC").address,
  })
  return data || []
}
