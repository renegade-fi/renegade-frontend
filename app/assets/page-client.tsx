"use client"

import React from "react"

import { InfoCircledIcon } from "@radix-ui/react-icons"
import {
  TaskType,
  Token,
  UpdateType,
  useTaskHistory,
  useBackOfQueueWallet,
} from "@renegade-fi/react"
import { Info } from "lucide-react"
import { formatUnits } from "viem/utils"
import { useAccount, useReadContracts } from "wagmi"

import { DataTable as AssetTable } from "@/app/assets/assets-table/data-table"
import { DataTable as TransferHistoryTable } from "@/app/assets/history-table/data-table"

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { usePriceQueries } from "@/hooks/use-price-queries"
import { useRefreshOnBlock } from "@/hooks/use-refresh-on-block"
import { amountTimesPrice } from "@/hooks/use-usd-price"
import { ASSETS_TOOLTIP } from "@/lib/constants/tooltips"
import { erc20Abi } from "@/lib/generated"
import { createPriceTopic } from "@/lib/query"
import { DISPLAY_TOKENS } from "@/lib/token"

import { columns as assetColumns } from "./assets-table/columns"
import { columns as historyColumns } from "./history-table/columns"

export type BalanceData = {
  mint: `0x${string}`
  rawRenegadeBalance: bigint
  renegadeBalance: number
  rawL2Balance: bigint
  l2Balance: number
  l2UsdValue: string
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
  const [showZeroL2Balance, setShowZeroL2Balance] = React.useState(true)

  const { address } = useAccount()
  const { data: l2Balances, queryKey } = useReadContracts({
    contracts: DISPLAY_TOKENS().map((token) => ({
      address: token.address,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [address],
    })),
    query: {
      enabled: !!address,
    },
  })

  useRefreshOnBlock({ queryKey })

  const priceResults = usePriceQueries(DISPLAY_TOKENS())

  const balances: BalanceData[] = React.useMemo(() => {
    const l2BalancesMap = new Map(
      l2Balances?.map((balance, index) => [
        DISPLAY_TOKENS()[index].address,
        balance.status === "success" ? balance.result : BigInt(0),
      ]),
    )
    return DISPLAY_TOKENS()
      .map((token, i) => {
        const t = Token.findByAddress(token.address)

        const renegadeBalance =
          renegadeBalances?.get(token.address) ?? BigInt(0)

        const priceTopic = createPriceTopic("binance", t.address)
        const price = priceResults[i]?.data ?? 0
        const renegadeUsdValueBigInt = amountTimesPrice(renegadeBalance, price)
        const renegadeUsdValue = formatUnits(renegadeUsdValueBigInt, t.decimals)

        const l2Balance = l2BalancesMap.get(token.address) ?? BigInt(0)
        const l2UsdValueBigInt = amountTimesPrice(l2Balance, price)
        const l2UsdValue = formatUnits(l2UsdValueBigInt, t.decimals)

        return {
          mint: token.address,
          rawRenegadeBalance: renegadeBalance,
          renegadeBalance: Number(formatUnits(renegadeBalance, t.decimals)),
          renegadeUsdValue,
          rawL2Balance: l2Balance,
          l2Balance: Number(formatUnits(l2Balance, t.decimals)),
          l2UsdValue,
        }
      })
      .filter((balance) =>
        !showZeroL2Balance ? balance.l2Balance !== 0 : true,
      )
      .filter((balance) =>
        !showZeroRenegadeBalance ? balance.renegadeBalance !== 0 : true,
      )
  }, [
    l2Balances,
    priceResults,
    renegadeBalances,
    showZeroL2Balance,
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
    <main>
      <div className="container">
        <div className="mt-12">
          <h1 className="mt-6 font-serif text-3xl font-bold">Assets</h1>
          <AssetTable
            columns={assetColumns}
            data={balances}
            setShowZeroL2Balance={setShowZeroL2Balance}
            setShowZeroRenegadeBalance={setShowZeroRenegadeBalance}
            showZeroL2Balance={showZeroL2Balance}
            showZeroRenegadeBalance={showZeroRenegadeBalance}
          />
          <Tooltip>
            <TooltipTrigger>
              <span className="mt-4 flex items-center text-xs text-muted-foreground">
                <Info className="mr-1 h-3 w-3" />
                Where are my assets?
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-sans">{ASSETS_TOOLTIP}</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="mt-20">
          <h1 className="my-6 font-serif text-3xl font-bold">
            Transfer History
          </h1>
          <TransferHistoryTable
            columns={historyColumns}
            data={historyData}
          />
        </div>
      </div>
    </main>
  )
}
