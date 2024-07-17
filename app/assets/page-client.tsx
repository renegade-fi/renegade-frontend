'use client'

import React from 'react'

import {
  TaskType,
  Token,
  UpdateType,
  useTaskHistory,
  useWallet,
} from '@renegade-fi/react'
import { useAccount, useBlockNumber } from 'wagmi'

import { DataTable as AssetTable } from '@/app/assets/assets-table/data-table'
import { DataTable as TransferHistoryTable } from '@/app/assets/history-table/data-table'

import { config } from '@/components/wagmi-provider/config'

import { DEFAULT_MINT } from '@/lib/constants/protocol'
import { formatNumber } from '@/lib/format'
import { readErc20BalanceOf } from '@/lib/generated'
import { DISPLAY_TOKENS } from '@/lib/token'

import { columns as assetColumns } from './assets-table/columns'
import { columns as historyColumns } from './history-table/columns'

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

  const [l2Balances, setL2Balances] = React.useState<
    Map<`0x${string}`, bigint>
  >(new Map())
  const { address } = useAccount()
  const { data: blockNumber } = useBlockNumber({ watch: true })
  // TODO: Integrate QueryClient
  React.useEffect(() => {
    const fetchBalances = async () => {
      if (!address) {
        return
      }
      const balancePromises = DISPLAY_TOKENS().map(async token => {
        const balance = await readErc20BalanceOf(config, {
          address: token.address as `0x${string}`,
          args: [address ?? '0x'],
        })
        return { address: token.address as `0x${string}`, balance }
      })
      const result = await Promise.all(balancePromises).then(balances => {
        const map = new Map<`0x${string}`, bigint>()
        balances.forEach(balance => {
          map.set(balance.address, balance.balance)
        })
        return map
      })
      setL2Balances(result)
    }
    fetchBalances()
  }, [address, blockNumber])

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
          l2Balances.get(token.address) ?? BigInt(0),
          t.decimals,
          isLongFormat,
        ),
      }
    })
    .filter(balance => (!showZeroL2Balance ? balance.l2Balance !== '0' : true))
    .filter(balance =>
      !showZeroRenegadeBalance ? balance.renegadeBalance !== '0' : true,
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
      <div className="container mx-auto space-y-12 sm:max-w-screen-md">
        <div className="space-y-4">
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
        <div className="space-y-4">
          <h1 className="mt-6 font-serif text-3xl font-bold">
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
