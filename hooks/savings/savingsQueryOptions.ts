import type { QueryKey, UseQueryOptions } from "@tanstack/react-query"

export type SavingsQueryVariables = {
  amount: string // value the backend expects (string / decimal)
  baseMint: `0x${string}`
  direction: "buy" | "sell"
  quoteTicker: "USDC"
  isQuoteCurrency: boolean
  renegadeFeeRate: number
}

/** Favtory function returning query options for the savings query */
export function savingsQueryOptions(
  vars: SavingsQueryVariables,
): UseQueryOptions<number, Error, number, QueryKey> {
  const queryKey: QueryKey = ["savings", vars]

  const queryFn = async (): Promise<number> => {
    const res = await fetch("/api/savings", {
      method: "POST",
      body: JSON.stringify(vars),
    })

    if (!res.ok) throw new Error(res.statusText)

    const json = (await res.json()) as { savings: number }
    return json.savings
  }

  return {
    queryKey,
    queryFn,
    retry: 3,
    staleTime: 0,
    enabled: !!Number.parseFloat(vars.amount),
  }
}
