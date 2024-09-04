import { OrderMetadata, Token } from "@renegade-fi/react"

import { amountTimesPrice } from "@/hooks/use-usd-price"
import { adjustPriceDecimals } from "@/lib/utils"

export function getVWAP(order: OrderMetadata): number {
  if (order.fills.length === 0) {
    return 0
  }

  const token = Token.findByAddress(order.data.base_mint)
  const quoteToken = Token.findByAddress(order.data.quote_mint)

  let totalVolume = BigInt(0)
  let totalValue = BigInt(0)

  for (const fill of order.fills) {
    const fillVolume = fill.amount
    const fillValue = amountTimesPrice(
      fill.amount,
      adjustPriceDecimals(
        fill.price.price,
        token.decimals,
        quoteToken.decimals,
      ),
    )

    totalVolume += fillVolume
    totalValue += fillValue
  }

  if (totalVolume === BigInt(0)) {
    return 0
  }

  return Number(totalValue) / Number(totalVolume)
}
