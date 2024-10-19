import { mainnet } from "viem/chains"
import { formatUnits } from "viem/utils"
import { useAccount } from "wagmi"

import { useToken } from "@/components/dialogs/transfer/hooks/use-token"

import { formatNumber } from "@/lib/format"
import { useReadErc20BalanceOf } from "@/lib/generated"
import { chain } from "@/lib/viem"
import { mainnetConfig } from "@/providers/wagmi-provider/wagmi-provider"

export function useChainBalance({
  chainId = chain.id,
  mint,
  enabled = true,
}: {
  chainId?: number
  mint: string
  enabled?: boolean
}) {
  const { address } = useAccount()
  const baseToken = useToken({ chainId, mint })
  const { data: balance, queryKey } = useReadErc20BalanceOf({
    address: baseToken?.address,
    args: [address ?? "0x"],
    config: chainId === mainnet.id ? mainnetConfig : undefined,
    query: {
      enabled: enabled && !!baseToken && !!address,
      staleTime: 0,
    },
  })

  const formattedBalance = baseToken
    ? formatUnits(balance ?? BigInt(0), baseToken.decimals)
    : ""
  const balanceLabel = baseToken
    ? formatNumber(balance ?? BigInt(0), baseToken.decimals, true)
    : ""

  return {
    bigint: balance,
    string: formattedBalance,
    formatted: balanceLabel,
    nonZero: balance && balance !== BigInt(0),
  }
}
