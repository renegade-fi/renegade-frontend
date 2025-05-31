import { useQuery } from "@tanstack/react-query"
import { zeroAddress } from "viem"

import { TimeToFillResponse } from "@/app/api/stats/time-to-fill/route"

import { resolveAddress } from "@/lib/token"

interface TimeToFillParams {
  amount: string
  mint: `0x${string}`
}

export function useTimeToFill({ amount, mint }: TimeToFillParams) {
  return useQuery({
    queryKey: ["timeToFill", amount, mint],
    queryFn: async () => {
      const ticker = resolveAddress(mint).ticker
      const searchParams = new URLSearchParams({
        amount,
        baseTicker: ticker,
      })

      const response = await fetch(`/api/stats/time-to-fill?${searchParams}`)
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to fetch time to fill")
      }

      const { data, error } = (await response.json()) as TimeToFillResponse

      if (error) {
        throw new Error(error)
      }

      if (!data) {
        throw new Error("No data received")
      }

      return data.estimatedMs
    },
    enabled: Boolean(amount && mint),
  })
}
