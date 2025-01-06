"use client"

import React from "react"

import { TaskType, Token, UpdateType } from "@renegade-fi/react"
import { Info } from "lucide-react"
import { formatUnits } from "viem/utils"

import { DataTable as AssetTable } from "@/app/assets/assets-table/data-table"
import { DataTable as TransferHistoryTable } from "@/app/assets/history-table/data-table"

import {
  ResponsiveTooltip,
  ResponsiveTooltipContent,
  ResponsiveTooltipTrigger,
} from "@/components/ui/responsive-tooltip"

import { useAssetsTableData } from "@/hooks/use-assets-table-data"
import { useTaskHistory } from "@/hooks/use-task-history"
import { ASSETS_TOOLTIP } from "@/lib/constants/tooltips"
import { DISPLAY_TOKENS } from "@/lib/token"

import { columns as assetColumns } from "./assets-table/columns"
import { columns as historyColumns } from "./history-table/columns"

export type HistoryData = {
  status: string
  mint: `0x${string}`
  amount: number
  rawAmount: bigint
  timestamp: number
  isWithdrawal: UpdateType
}

export function PageClient() {
  const [showZeroRenegadeBalance, setShowZeroRenegadeBalance] =
    React.useState(true)
  const [showZeroOnChainBalance, setShowZeroOnChainBalance] =
    React.useState(true)

  const rawTableData = useAssetsTableData({
    mints: DISPLAY_TOKENS().map((token) => token.address),
  })

  const filteredTableData = React.useMemo(() => {
    if (showZeroOnChainBalance && showZeroRenegadeBalance) {
      return rawTableData
    }
    return rawTableData.filter((row) => {
      return row.onChainBalance !== 0 || row.renegadeBalance !== 0
    })
  }, [rawTableData, showZeroOnChainBalance, showZeroRenegadeBalance])

  // Transfer History Table Data
  const { data: transferHistory } = useTaskHistory({
    limit: 1000,
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
          data={filteredTableData}
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
          <ResponsiveTooltipContent>{ASSETS_TOOLTIP}</ResponsiveTooltipContent>
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
