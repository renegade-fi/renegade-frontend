"use client"

import React from "react"

import {
  TaskType,
  Token,
  UpdateType,
  useBackOfQueueWallet,
  useTaskHistory,
} from "@renegade-fi/react"
import { Info } from "lucide-react"
import { formatUnits } from "viem/utils"
import { useAccount } from "wagmi"

import { DataTable as AssetTable } from "@/app/assets/assets-table/data-table"
import { DataTable as TransferHistoryTable } from "@/app/assets/history-table/data-table"

import {
  ResponsiveTooltip,
  ResponsiveTooltipContent,
  ResponsiveTooltipTrigger,
} from "@/components/ui/responsive-tooltip"

import { useCombinedBalances } from "@/hooks/use-combined-balances"
import { usePriceQueries } from "@/hooks/use-price-queries"
import { useRefreshOnBlock } from "@/hooks/use-refresh-on-block"
import { amountTimesPrice } from "@/hooks/use-usd-price"
import { ASSETS_TOOLTIP } from "@/lib/constants/tooltips"
import { DISPLAY_TOKENS } from "@/lib/token"

import { columns as assetColumns } from "./assets-table/columns"
import { columns as historyColumns } from "./history-table/columns"

export type BalanceData = {
  mint: `0x${string}`
  rawRenegadeBalance: bigint
  renegadeBalance: number
  rawOnChainBalance: bigint
  onChainBalance: number
  onChainUsdValue: string
  renegadeUsdValue: string
}

export type HistoryData = {
  status: string
  mint: `0x${string}`
  amount: number
  rawAmount: bigint
  timestamp: number
  isWithdrawal: UpdateType
}

export function PageClient() {
  const { data: renegadeBalances } = useBackOfQueueWallet({
    query: {
      select: (data) =>
        new Map(data.balances.map((balance) => [balance.mint, balance.amount])),
    },
  })
  const [showZeroRenegadeBalance, setShowZeroRenegadeBalance] =
    React.useState(true)
  const [showZeroOnChainBalance, setShowZeroOnChainBalance] =
    React.useState(true)

  const { address } = useAccount()
  const { data: combinedBalances, queryKey } = useCombinedBalances(address)

  useRefreshOnBlock({ queryKey })

  const priceResults = usePriceQueries(DISPLAY_TOKENS())

  const balances: BalanceData[] = React.useMemo(() => {
    return DISPLAY_TOKENS()
      .map((token, i) => {
        const t = Token.findByAddress(token.address)

        const renegadeBalance =
          renegadeBalances?.get(token.address) ?? BigInt(0)

        const price = priceResults[i]?.data ?? 0
        const renegadeUsdValueBigInt = amountTimesPrice(renegadeBalance, price)
        const renegadeUsdValue = formatUnits(renegadeUsdValueBigInt, t.decimals)

        const onChainBalance = combinedBalances?.get(token.address) ?? BigInt(0)
        const onChainUsdValueBigInt = amountTimesPrice(onChainBalance, price)
        const onChainUsdValue = formatUnits(onChainUsdValueBigInt, t.decimals)

        return {
          mint: token.address,
          rawRenegadeBalance: renegadeBalance,
          renegadeBalance: Number(formatUnits(renegadeBalance, t.decimals)),
          renegadeUsdValue,
          rawOnChainBalance: onChainBalance,
          onChainBalance: Number(formatUnits(onChainBalance, t.decimals)),
          onChainUsdValue,
        }
      })
      .filter((balance) => {
        if (!showZeroOnChainBalance && !showZeroRenegadeBalance) {
          return balance.onChainBalance !== 0 || balance.renegadeBalance !== 0
        }
        return true
      })
  }, [
    combinedBalances,
    priceResults,
    renegadeBalances,
    showZeroOnChainBalance,
    showZeroRenegadeBalance,
  ])

  // Transfer History Table Data
  const { data: transferHistory } = useTaskHistory({
    query: {
      select: (data) => Array.from(data.values()),
    },
  })

  const historyData = React.useMemo(() => {
    return (transferHistory ?? []).reduce<HistoryData[]>((acc, task) => {
      if (
        task.task_info.task_type === TaskType.UpdateWallet &&
        (task.task_info.update_type === UpdateType.Deposit ||
          task.task_info.update_type === UpdateType.Withdraw)
      ) {
        const token = Token.findByAddress(task.task_info.mint)

        acc.push({
          status: task.state,
          mint: task.task_info.mint,
          amount: Number(formatUnits(task.task_info.amount, token.decimals)),
          rawAmount: task.task_info.amount,
          timestamp: Number(task.created_at),
          isWithdrawal: task.task_info.update_type,
        })
      }
      return acc
    }, [])
  }, [transferHistory])

  return (
    <main className="container px-4 lg:px-8">
      <div className="mt-12">
        <h1 className="font-serif text-3xl font-bold tracking-tighter lg:tracking-normal">
          Assets
        </h1>
        <AssetTable
          columns={assetColumns}
          data={balances}
          setShowZeroOnChainBalance={setShowZeroOnChainBalance}
          setShowZeroRenegadeBalance={setShowZeroRenegadeBalance}
          showZeroOnChainBalance={showZeroOnChainBalance}
          showZeroRenegadeBalance={showZeroRenegadeBalance}
        />
        <ResponsiveTooltip>
          <ResponsiveTooltipTrigger>
            <span className="mt-4 flex cursor-pointer items-center text-xs text-muted-foreground">
              <Info className="mr-1 h-3 w-3" />
              Where are my assets?
            </span>
          </ResponsiveTooltipTrigger>
          <ResponsiveTooltipContent>
            <p className="font-sans">{ASSETS_TOOLTIP}</p>
          </ResponsiveTooltipContent>
        </ResponsiveTooltip>
      </div>
      <div className="mt-20">
        <h1 className="font-serif text-3xl font-bold tracking-tighter lg:tracking-normal">
          Transfer History
        </h1>
        <div className="mt-2 lg:mt-4">
          <TransferHistoryTable
            columns={historyColumns}
            data={historyData}
          />
        </div>
      </div>
    </main>
  )
}
