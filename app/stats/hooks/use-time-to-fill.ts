import { useQuery } from "@tanstack/react-query"

import { TimeToFillResponse } from "@/app/api/stats/time-to-fill/route"

interface TimeToFillParams {
  amount: string
  baseTicker: string
}

export function useTimeToFill({ amount, baseTicker }: TimeToFillParams) {
  return useQuery({
    queryKey: ["timeToFill", amount, baseTicker],
    queryFn: async () => {
      const searchParams = new URLSearchParams({
        amount,
        baseTicker,
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
    enabled: Boolean(amount && baseTicker),
  })
}
