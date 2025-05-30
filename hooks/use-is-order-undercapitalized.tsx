import { useBackOfQueueWallet } from "@renegade-fi/react"
import { formatUnits } from "viem/utils"

import { useUSDPrice } from "@/hooks/use-usd-price"
import { Side } from "@/lib/constants/protocol"
import { resolveAddress } from "@/lib/token"

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
  const baseToken = resolveAddress(baseMint)
  const quoteToken = resolveAddress(quoteMint)
  const token = side === Side.BUY ? quoteToken : baseToken

  const { data: balance } = useBackOfQueueWallet({
    query: {
      select: (data) =>
        data.balances.find((balance) => balance.mint === token.address)?.amount,
    },
  })

  const usdPrice = useUSDPrice(resolveAddress(baseMint), amount)

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
