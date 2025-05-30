import { Token } from "@renegade-fi/token-nextjs"
import { parseUnits } from "viem/utils"

import { usePriceQuery } from "@/hooks/use-price-query"

// Returns the price of the base token in quote token terms, denominated in the base token's decimals
export function useBasePerQuotePrice(baseMint: `0x${string}`) {
  const token = Token.findByAddress(baseMint)
  const { data: usdPerBasePrice } = usePriceQuery(baseMint)
  if (!usdPerBasePrice) {
    return null
  }

  // Use Math.ceil to prevent division by zero
  const basePerQuotePrice =
    parseUnits("1", token.decimals) / BigInt(Math.ceil(usdPerBasePrice))
  return basePerQuotePrice
}
