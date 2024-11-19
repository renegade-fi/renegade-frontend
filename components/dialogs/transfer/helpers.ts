import { Token } from "@renegade-fi/react"
import { QueryClient } from "@tanstack/react-query"
import { formatUnits } from "viem"
import { z } from "zod"

import { MIN_DEPOSIT_AMOUNT } from "@/lib/constants/protocol"
import { safeParseUnits } from "@/lib/format"
import { createPriceQueryKey } from "@/lib/query"
import { chain, extractSupportedChain } from "@/lib/viem"

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

/**
 * Checks if the transfer amount is above the spam prevention threshold.
 *
 * This function determines whether a given transfer amount meets or exceeds
 * the minimum threshold set to prevent spam transactions (e.g., 1 USDC).
 * It uses the current price of the token to perform the conversion.
 *
 * @param queryClient - The query client used to fetch the current token price.
 * @param amount - The transfer amount as a string.
 * @param baseToken - The token being transferred, which includes its address for price lookup.
 * @returns true if amount is greater than or equal to the spam threshold, false otherwise
 */
export function isValidTransferAmount(
  queryClient: QueryClient,
  amount: string,
  baseToken?: Token,
) {
  console.log("check amount debug: ", {
    amount,
    baseToken,
  })
  if (!baseToken) return false
  const usdPrice = queryClient.getQueryData<number>(
    createPriceQueryKey("binance", baseToken.address),
  )
  if (!usdPrice) return false
  const amountInUsd = Number(amount) * usdPrice
  return amountInUsd >= MIN_DEPOSIT_AMOUNT
}

/**
 * Validates if user's balance is sufficient for a transfer.
 *
 * @param params - Transfer parameters
 * @param params.amount - Transfer amount (string)
 * @param params.mint - Token contract address
 * @param params.balance - User's current balance (optional bigint)
 * @returns false if balance is insufficient/undefined or if validation fails,
 *          true if amount <= balance
 */
export function isBalanceSufficient({
  amount,
  mint,
  balance,
}: z.infer<typeof formSchema> & { balance?: bigint }) {
  console.log("check balance debug: ", {
    amount,
    mint,
    balance,
  })
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

/**
 * Checks if the transfer amount equals the entire balance.
 *
 * @param amount - Transfer amount as string
 * @param mint - Token contract address
 * @param balance - User's current balance in bigint
 * @returns true if amount matches formatted balance, false otherwise
 */
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

export function constructArbitrumBridgeUrl(
  amount: string,
  mint?: `0x${string}`,
) {
  const base = new URL("https://bridge.arbitrum.io/")
  base.searchParams.set("amount", amount)
  base.searchParams.set("destinationChain", "arbitrum-one")
  base.searchParams.set("sourceChain", "ethereum")
  if (mint) {
    base.searchParams.set("token", mint)
  }

  return base.toString()
}

export function normalizeStatus(
  status?: "NOT_FOUND" | "INVALID" | "PENDING" | "DONE" | "FAILED",
): "error" | "pending" | "success" | undefined {
  if (!status) return undefined
  switch (status) {
    case "NOT_FOUND":
      return undefined
    case "INVALID":
    case "FAILED":
      return "error"
    case "DONE":
      return "success"
    default:
      return "pending"
  }
}

export function getExplorerLink(
  txHash: string,
  chainId: number = chain.id,
): string {
  const _chain = extractSupportedChain(chainId)

  const explorerUrl = _chain.blockExplorers?.default.url
  if (!explorerUrl) {
    throw new Error(`No block explorer URL found for chain ${_chain.name}`)
  }
  return `${explorerUrl}/tx/${txHash}`
}
