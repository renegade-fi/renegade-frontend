import { useBackOfQueueWallet, Token } from "@renegade-fi/react"
import { formatUnits, isAddress } from "viem/utils"

import { formatNumber } from "@/lib/format"

export function useRenegadeBalance(mint: string) {
  const baseToken = Token.findByAddress(mint as `0x${string}`)
  const { data: renegadeBalance } = useBackOfQueueWallet({
    query: {
      select: (data) =>
        data.balances.find((balance) => balance.mint === mint)?.amount,
      enabled: !!mint && isAddress(mint) && !!baseToken,
    },
  })

  const formattedRenegadeBalance = baseToken
    ? formatUnits(renegadeBalance ?? BigInt(0), baseToken.decimals)
    : ""
  const renegadeBalanceLabel = baseToken
    ? formatNumber(renegadeBalance ?? BigInt(0), baseToken.decimals, true)
    : ""

  return {
    bigint: renegadeBalance,
    string: formattedRenegadeBalance,
    formatted: renegadeBalanceLabel,
  }
}
