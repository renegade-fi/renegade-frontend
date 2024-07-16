'use client'

import React from 'react'

import { Token, useWallet } from '@renegade-fi/react'
import { useAccount, useBlockNumber } from 'wagmi'

import { DataTable } from '@/app/assets/data-table'
import { TransferHistoryTable } from '@/app/assets/transfer-history-table'

import { Separator } from '@/components/ui/separator'
import { config } from '@/components/wagmi-provider/config'

import { DEFAULT_MINT } from '@/lib/constants/protocol'
import { formatNumber } from '@/lib/format'
import { readErc20BalanceOf } from '@/lib/generated'
import { DISPLAY_TOKENS } from '@/lib/token'

import { columns } from './columns'

export type BalanceData = {
  mint: `0x${string}`
  renegadeBalance: string
  l2Balance: string
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

  return (
    <main>
      <div className="container space-y-12">
        <div className="space-y-2">
          <h1 className="mt-6 font-serif text-3xl font-bold">Assets</h1>
          <DataTable
            columns={columns}
            data={balances ?? []}
            isLongFormat={isLongFormat}
            setIsLongFormat={setIsLongFormat}
            setShowZeroL2Balance={setShowZeroL2Balance}
            setShowZeroRenegadeBalance={setShowZeroRenegadeBalance}
            showZeroL2Balance={showZeroL2Balance}
            showZeroRenegadeBalance={showZeroRenegadeBalance}
          />
        </div>
        <Separator />
        <div className="space-y-2">
          <h1 className="mt-6 font-serif text-3xl font-bold">
            Transfer History
          </h1>
          <TransferHistoryTable />
        </div>
      </div>
    </main>
  )
}
