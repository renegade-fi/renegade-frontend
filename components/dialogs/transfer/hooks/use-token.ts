import { Token } from "@renegade-fi/react"
import { mainnet } from "viem/chains"
import { isAddress } from "viem/utils"

import { ETHEREUM_TOKENS } from "@/lib/token"
import { chain } from "@/lib/viem"

export function useToken({
  chainId = chain.id,
  mint,
}: {
  chainId?: number
  mint?: string
}): Token | undefined {
  if (!mint || !isAddress(mint)) return undefined

  const address = mint as `0x${string}`
  const baseToken = Token.findByAddress(address)

  if (chainId === chain.id) return baseToken
  if (chainId === mainnet.id && baseToken) {
    const ticker = baseToken.ticker as keyof typeof ETHEREUM_TOKENS
    return ETHEREUM_TOKENS[ticker]
  }
  return undefined
}
