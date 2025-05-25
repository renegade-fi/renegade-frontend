import { useBackOfQueueWallet } from "@renegade-fi/react"
import { formatUnits, isAddress } from "viem/utils"

import { useToken } from "@/components/dialogs/transfer/hooks/use-token"

import { formatNumber } from "@/lib/format"

export function useRenegadeBalance(mint: string) {
  const token = useToken({ mint })
  const { data: renegadeBalance } = useBackOfQueueWallet({
    query: {
      select: (data) =>
        data.balances.find((balance) => balance.mint === mint)?.amount,
      enabled: !!mint && isAddress(mint) && !!token,
    },
  })

  const formattedRenegadeBalance = token
    ? formatUnits(renegadeBalance ?? BigInt(0), token.decimals)
    : ""
  const renegadeBalanceLabel = token
    ? formatNumber(renegadeBalance ?? BigInt(0), token.decimals, true)
    : ""

  return {
    bigint: renegadeBalance,
    string: formattedRenegadeBalance,
    formatted: renegadeBalanceLabel,
  }
}
