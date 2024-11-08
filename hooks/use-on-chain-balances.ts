import { useMemo } from "react"

import { useQueries } from "@tanstack/react-query"

import { useCombinedBalances } from "@/hooks/use-combined-balances"
import { readErc20BalanceOf } from "@/lib/generated"
import { isTestnet } from "@/lib/viem"
import { config } from "@/providers/wagmi-provider/wagmi-provider"

interface UseOnChainBalancesOptions {
  address?: `0x${string}`
  mints: `0x${string}`[]
  enabled?: boolean
}

export function useOnChainBalances({
  address,
  mints,
  enabled = true,
}: UseOnChainBalancesOptions) {
  const arbitrumBalances = useQueries({
    queries: mints.map((mint) => ({
      queryKey: [
        "readContract",
        {
          address: mint,
          args: [address],
          chainId: config.chains[0].id,
          functionName: "balanceOf",
        },
      ],
      queryFn: async () => {
        if (!address) return BigInt(0)
        return readErc20BalanceOf(config, {
          address: mint,
          args: [address],
        })
      },
      enabled: !!address && enabled && isTestnet,
    })),
    combine: (results) => {
      return new Map<`0x${string}`, bigint>(
        mints.map((mint, i) => [mint, results[i].data ?? BigInt(0)]),
      )
    },
  })

  const { data: combinedBalances, ...rest } = useCombinedBalances({
    address,
    enabled: enabled && !isTestnet,
  })

  const data = useMemo(() => {
    if (isTestnet) {
      return arbitrumBalances
    }
    return combinedBalances
  }, [arbitrumBalances, combinedBalances, isTestnet])

  return { data, ...rest }
}
