import { Token, useBackOfQueueWallet } from "@renegade-fi/react"
import { formatUnits } from "viem/utils"

import { useUSDPrice } from "@/hooks/use-usd-price"
import { Side } from "@/lib/constants/protocol"

export function useIsOrderUndercapitalized({
  amount,
  baseMint,
  quoteMint,
  side,
}: {
  amount: bigint
  baseMint: `0x${string}`
  quoteMint: `0x${string}`
  side: Side
}) {
  const baseToken = Token.findByAddress(baseMint)
  const quoteToken = Token.findByAddress(quoteMint)
  const token = side === Side.BUY ? quoteToken : baseToken

  const { data: balance } = useBackOfQueueWallet({
    query: {
      select: (data) =>
        data.balances.find((balance) => balance.mint === token.address)?.amount,
    },
  })

  const usdPrice = useUSDPrice(Token.findByAddress(baseMint), amount)

  const isUndercapitalized = (() => {
    if (side === Side.BUY) {
      const formattedUsdPrice = formatUnits(
        usdPrice,
        side === Side.BUY ? baseToken.decimals : quoteToken.decimals,
      )
      return balance
        ? parseFloat(formatUnits(balance, token.decimals)) <
            parseFloat(formattedUsdPrice)
        : true
    } else {
      return balance ? balance < amount : true
    }
  })()

  return {
    isUndercapitalized,
    token,
  }
}
