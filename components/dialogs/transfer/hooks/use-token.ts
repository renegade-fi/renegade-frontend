import { Token } from "@renegade-fi/token-nextjs"
import { mainnet } from "viem/chains"
import { isAddress } from "viem/utils"

import { ETHEREUM_TOKENS, resolveAddress } from "@/lib/token"

export function useToken({
  chainId,
  mint,
}: {
  chainId?: number
  mint?: string
}): InstanceType<typeof Token> | undefined {
  if (!mint || !isAddress(mint)) return undefined

  const address = mint as `0x${string}`
  const baseToken = resolveAddress(address)

  if (!chainId) return baseToken
  if (chainId === mainnet.id && baseToken) {
    const ticker = baseToken.ticker as keyof typeof ETHEREUM_TOKENS
    return ETHEREUM_TOKENS[ticker]
  }
  return undefined
}
