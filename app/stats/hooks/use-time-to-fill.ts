import { useMemo } from "react"

interface TimeToFillParams {
  amount: number // Amount in USD
}

export function useTimeToFill({ amount }: TimeToFillParams): number {
  return useMemo(() => {
    // Constants for fill rate logic
    const INSTANT_FILL_THRESHOLD = 3000 // First $3000 is instant
    const FILL_RATE_PER_MINUTE = 5000 // $5000 per minute after instant fill

    // If amount is less than or equal to instant fill threshold, return 0
    if (amount <= INSTANT_FILL_THRESHOLD) {
      return 0
    }

    // Calculate remaining amount after instant fill
    const remainingAmount = amount - INSTANT_FILL_THRESHOLD

    // Calculate how many minutes needed to fill the remaining amount
    const minutesNeeded = Math.ceil(remainingAmount / FILL_RATE_PER_MINUTE)

    // Convert minutes to milliseconds
    return minutesNeeded * 60 * 1000
  }, [amount])
}
