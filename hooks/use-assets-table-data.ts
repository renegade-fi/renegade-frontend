import { useMemo } from "react"

import { useBackOfQueueWallet } from "@renegade-fi/react"
import { Token } from "@renegade-fi/token-nextjs"
import { formatUnits } from "viem/utils"
import { useAccount } from "wagmi"

import { useOnChainBalances } from "@/hooks/use-on-chain-balances"
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
  const { address } = useAccount()
  const { data: renegadeBalances } = useBackOfQueueWallet({
    query: {
      select: (data) =>
        new Map(data.balances.map((balance) => [balance.mint, balance.amount])),
    },
  })

  const { data: onChainBalances } = useOnChainBalances({
    address,
    mints,
  })

  const priceResults = usePriceQueries(
    mints.map((mint) => {
      const token = Token.findByAddress(mint)
      return Token.create(
        token.name,
        token.ticker,
        mint,
        token.decimals,
        token.rawSupportedExchanges,
        token.chainAddresses,
        token.logoUrl,
      )
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

      const onChainBalance = onChainBalances?.get(mint) ?? BigInt(0)
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
  }, [mints, onChainBalances, priceResults, renegadeBalances])

  return tableData
}
