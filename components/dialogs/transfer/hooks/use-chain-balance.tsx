import { Token } from "@renegade-fi/react"
import { mainnet } from "viem/chains"
import { formatUnits } from "viem/utils"
import { useAccount } from "wagmi"

import { formatNumber } from "@/lib/format"
import { useReadErc20BalanceOf } from "@/lib/generated"
import { chain } from "@/lib/viem"
import { mainnetConfig } from "@/providers/wagmi-provider/wagmi-provider"

export function useChainBalance({
  chainId = chain.id,
  token,
  enabled = true,
}: {
  chainId?: number
  token?: Token
  enabled?: boolean
}) {
  const { address } = useAccount()
  const { data: balance, queryKey } = useReadErc20BalanceOf({
    address: token?.address,
    args: [address ?? "0x"],
    config: chainId === mainnet.id ? mainnetConfig : undefined,
    query: {
      enabled: enabled && !!token && !!address,
      staleTime: 0,
    },
  })

  const formattedBalance = token
    ? formatUnits(balance ?? BigInt(0), token.decimals)
    : ""
  const balanceLabel = token
    ? formatNumber(balance ?? BigInt(0), token.decimals, true)
    : ""

  return {
    bigint: balance,
    string: formattedBalance,
    formatted: balanceLabel,
    nonZero: balance && balance !== BigInt(0),
    queryKey,
  }
}
