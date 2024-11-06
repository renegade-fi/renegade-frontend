import { useMemo } from "react"

import { Token, useBackOfQueueWallet } from "@renegade-fi/react"
import { formatUnits } from "viem/utils"
import { useAccount } from "wagmi"

import { useCombinedBalances } from "@/hooks/use-combined-balances"
import { usePriceQueries } from "@/hooks/use-price-queries"
import { amountTimesPrice } from "@/hooks/use-usd-price"

export type AssetsTableRow = {
  mint: `0x${string}`
  rawRenegadeBalance: bigint
  renegadeBalance: number
  renegadeUsdValue: string
  rawOnChainBalance: bigint
  onChainBalance: number
  onChainUsdValue: string
}

interface UseAssetsTableDataOptions {
  /** Token mint addresses to display in the assets table */
  mints: `0x${string}`[]
}

export function useAssetsTableData({ mints }: UseAssetsTableDataOptions) {
  const { data: renegadeBalances } = useBackOfQueueWallet({
    query: {
      select: (data) =>
        new Map(data.balances.map((balance) => [balance.mint, balance.amount])),
    },
  })

  const { address } = useAccount()
  const { data: combinedBalances } = useCombinedBalances(address)
  const priceResults = usePriceQueries(
    mints.map((mint) => {
      const token = Token.findByAddress(mint)
      return {
        address: mint,
        name: token.name,
        ticker: token.ticker,
        decimals: token.decimals,
      }
    }),
  )

  const tableData = useMemo(() => {
    return mints.map((mint, i) => {
      const token = Token.findByAddress(mint)

      const renegadeBalance = renegadeBalances?.get(mint) ?? BigInt(0)
      const price = priceResults[i]?.data ?? 0
      const renegadeUsdValueBigInt = amountTimesPrice(renegadeBalance, price)
      const renegadeUsdValue = formatUnits(
        renegadeUsdValueBigInt,
        token.decimals,
      )

      const onChainBalance = combinedBalances?.get(mint) ?? BigInt(0)
      const onChainUsdValueBigInt = amountTimesPrice(onChainBalance, price)
      const onChainUsdValue = formatUnits(onChainUsdValueBigInt, token.decimals)

      return {
        mint,
        rawRenegadeBalance: renegadeBalance,
        renegadeBalance: Number(formatUnits(renegadeBalance, token.decimals)),
        renegadeUsdValue,
        rawOnChainBalance: onChainBalance,
        onChainBalance: Number(formatUnits(onChainBalance, token.decimals)),
        onChainUsdValue,
      }
    })
  }, [mints, combinedBalances, priceResults, renegadeBalances])

  return tableData
}
