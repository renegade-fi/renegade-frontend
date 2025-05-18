import { Config } from "@renegade-fi/react"
import { Token } from "@renegade-fi/token-nextjs"
import { ROOT_KEY_MESSAGE_PREFIX } from "@renegade-fi/react/constants"
import { QueryClient } from "@tanstack/react-query"
import invariant from "tiny-invariant"
import { formatUnits, isAddress } from "viem"
import { z } from "zod"

import { MIN_DEPOSIT_AMOUNT } from "@/lib/constants/protocol"
import { safeParseUnits } from "@/lib/format"
import { createPriceQueryKey } from "@/lib/query"
import { chain, extractSupportedChain, viemClient } from "@/lib/viem"

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
  baseToken?: InstanceType<typeof Token>,
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

export function verifyRecipientAddress(config: Config, recipient?: string) {
  invariant(config.state.seed, "Seed is required")
  invariant(
    recipient && isAddress(recipient),
    "Recipient is required and must be a valid address",
  )
  return viemClient.verifyMessage({
    address: recipient,
    message: `${ROOT_KEY_MESSAGE_PREFIX} ${chain.id}`,
    signature: config.state.seed,
  })
}
