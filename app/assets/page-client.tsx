"use client"

import React from "react"

import {
  TaskType,
  Token,
  UpdateType,
  useTaskHistory,
  useWallet,
} from "@renegade-fi/react"
import { useQueryClient } from "@tanstack/react-query"
import { useAccount, useBlockNumber, useReadContracts } from "wagmi"

import { DataTable as AssetTable } from "@/app/assets/assets-table/data-table"
import { DataTable as TransferHistoryTable } from "@/app/assets/history-table/data-table"

import { DEFAULT_MINT } from "@/lib/constants/protocol"
import { formatNumber } from "@/lib/format"
import { erc20Abi } from "@/lib/generated"
import { DISPLAY_TOKENS } from "@/lib/token"

import { columns as assetColumns } from "./assets-table/columns"
import { columns as historyColumns } from "./history-table/columns"

export type BalanceData = {
  mint: `0x${string}`
  renegadeBalance: string
  l2Balance: string
}

export type HistoryData = {
  status: string
  mint: `0x${string}`
  amount: string
  timestamp: number
  isWithdrawal: boolean
}

export function PageClient() {
  const { data } = useWallet({
    query: {
      select: data =>
        new Map(
          data.balances
            .filter(balance => balance.mint !== DEFAULT_MINT)
            .map(balance => [balance.mint, balance.amount]),
        ),
    },
  })
  const [showZeroRenegadeBalance, setShowZeroRenegadeBalance] =
    React.useState(true)
  const [showZeroL2Balance, setShowZeroL2Balance] = React.useState(true)
  const [isLongFormat, setIsLongFormat] = React.useState(false)

  const { address } = useAccount()
  const { data: l2Balances, queryKey } = useReadContracts({
    contracts: DISPLAY_TOKENS().map(token => ({
      address: token.address,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [address],
    })),
    query: {
      enabled: !!address,
      select: data =>
        new Map(
          data.map((balance, index) => [
            DISPLAY_TOKENS()[index].address,
            balance.status === "success" ? balance.result : BigInt(0),
          ]),
        ),
    },
  })

  const queryClient = useQueryClient()
  const blockNumber = useBlockNumber({ watch: true })

  React.useEffect(() => {
    if (blockNumber) {
      queryClient.invalidateQueries({ queryKey })
    }
  }, [blockNumber, queryClient, queryKey])

  const balances: BalanceData[] = DISPLAY_TOKENS()
    .map(token => {
      const t = Token.findByAddress(token.address)
      return {
        mint: token.address,
        renegadeBalance: formatNumber(
          data?.get(token.address) ?? BigInt(0),
          t.decimals,
          isLongFormat,
        ),
        l2Balance: formatNumber(
          l2Balances?.get(token.address) ?? BigInt(0),
          t.decimals,
          isLongFormat,
        ),
      }
    })
    .filter(balance => (!showZeroL2Balance ? balance.l2Balance !== "0" : true))
    .filter(balance =>
      !showZeroRenegadeBalance ? balance.renegadeBalance !== "0" : true,
    )

  // Transfer History Table Data
  const { data: transferHistory } = useTaskHistory({
    query: {
      select: data => Array.from(data.values()),
    },
  })

  const [historyIsLongFormat, setHistoryIsLongFormat] = React.useState(false)
  const historyData = (transferHistory ?? []).reduce<HistoryData[]>(
    (acc, task) => {
      if (
        task.task_info.task_type === TaskType.UpdateWallet &&
        (task.task_info.update_type === UpdateType.Deposit ||
          task.task_info.update_type === UpdateType.Withdraw)
      ) {
        const token = Token.findByAddress(task.task_info.mint)
        const formattedAmount = formatNumber(
          task.task_info.amount,
          token.decimals,
          historyIsLongFormat,
        )
        acc.push({
          status: task.state,
          mint: task.task_info.mint,
          amount: formattedAmount,
          timestamp: Number(task.created_at),
          isWithdrawal: task.task_info.update_type === UpdateType.Withdraw,
        })
      }
      return acc
    },
    [],
  )

  return (
    <main>
      <div className="container">
        <div className="mt-12">
          <h1 className="mt-6 font-serif text-3xl font-bold">Assets</h1>
          <AssetTable
            columns={assetColumns}
            data={balances}
            isLongFormat={isLongFormat}
            setIsLongFormat={setIsLongFormat}
            setShowZeroL2Balance={setShowZeroL2Balance}
            setShowZeroRenegadeBalance={setShowZeroRenegadeBalance}
            showZeroL2Balance={showZeroL2Balance}
            showZeroRenegadeBalance={showZeroRenegadeBalance}
          />
        </div>
        <div className="mt-20">
          <h1 className="my-6 font-serif text-3xl font-bold">
            Transfer History
          </h1>
          <TransferHistoryTable
            columns={historyColumns}
            data={historyData}
            isLongFormat={historyIsLongFormat}
            setIsLongFormat={setHistoryIsLongFormat}
          />
        </div>
      </div>
    </main>
  )
}
