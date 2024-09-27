import { Token } from "@renegade-fi/react"
import { QueryClient } from "@tanstack/react-query"
import { formatUnits } from "viem"
import { z } from "zod"

import { MIN_DEPOSIT_AMOUNT } from "@/lib/constants/protocol"
import { safeParseUnits } from "@/lib/format"
import { createPriceQueryKey } from "@/lib/query"

export enum ExternalTransferDirection {
  Deposit,
  Withdraw,
}

export const formSchema = z.object({
  amount: z
    .string()
    .min(1, { message: "Amount is required" })
    .refine(
      (value) => {
        const num = parseFloat(value)
        return !isNaN(num) && num > 0
      },
      { message: "Amount must be greater than zero" },
    ),
  mint: z.string().min(1, {
    message: "Token is required",
  }),
})

// Return true if the amount is greater than or equal to the minimum deposit amount (1 USDC)
export function checkAmount(
  queryClient: QueryClient,
  amount: string,
  baseToken?: Token,
) {
  if (!baseToken) return false
  const usdPrice = queryClient.getQueryData<number>(
    createPriceQueryKey("binance", baseToken.address),
  )
  if (!usdPrice) return false
  const amountInUsd = Number(amount) * usdPrice
  return amountInUsd >= MIN_DEPOSIT_AMOUNT
}

// Returns true if the amount is less than or equal to the balance
// Returns false if the amount is greater than the balance or if the amount is invalid
export function checkBalance({
  amount,
  mint,
  balance,
}: z.infer<typeof formSchema> & { balance?: bigint }) {
  if (!balance) {
    return false
  }
  try {
    const token = Token.findByAddress(mint as `0x${string}`)
    const parsedAmount = safeParseUnits(amount, token.decimals)
    if (parsedAmount instanceof Error) {
      return false
    }
    return parsedAmount <= balance
  } catch (error) {
    return false
  }
}

// Returns true iff the amount is equal to the balance
export function isMaxBalance({
  amount,
  mint,
  balance,
}: z.infer<typeof formSchema> & { balance?: bigint }) {
  if (!balance) {
    return false
  }
  try {
    const token = Token.findByAddress(mint as `0x${string}`)
    const formattedAmount = formatUnits(balance, token.decimals)
    return amount === formattedAmount
  } catch (error) {
    return false
  }
}
