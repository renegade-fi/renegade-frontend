import { useMemo } from "react"

import { useQueries } from "@tanstack/react-query"
import { useConfig } from "wagmi"

import { useCombinedBalances } from "@/hooks/use-combined-balances"
import { readErc20BalanceOf } from "@/lib/generated"
import { isTestnet } from "@/lib/viem"
import { useCurrentChain } from "@/providers/state-provider/hooks"

import { useIsBase } from "./use-is-base"

interface UseOnChainBalancesOptions {
  address?: `0x${string}`
  mints: `0x${string}`[]
  enabled?: boolean
}

/**
 * Get the on-chain balances for a given set of mints
 * On Arbitrum One, combines balances from Mainnet and Solana
 * @param address - owner address
 * @param mints - tokens
 * @param enabled - whether to enable the query
 * @returns - Map of mints to balances (bigint)
 */
export function useOnChainBalances({
  address,
  mints,
  enabled = true,
}: UseOnChainBalancesOptions) {
  const config = useConfig()
  const chainId = useCurrentChain()
  const queries = useQueries({
    queries: mints.map((mint) => ({
      queryKey: [
        "readContract",
        {
          address: mint,
          args: [address],
          chainId,
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

  const isBase = useIsBase()
  const { data: combinedBalances, ...rest } = useCombinedBalances({
    address,
    enabled: enabled && !(isTestnet || isBase),
  })

  const data = useMemo(() => {
    if (isTestnet || isBase) {
      return queries
    }
    return combinedBalances
  }, [queries, combinedBalances, isBase])

  return { data, ...rest }
}
