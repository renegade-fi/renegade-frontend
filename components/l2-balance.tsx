'use client'

import * as React from 'react'

import { Token } from '@renegade-fi/react'
import { useAccount } from 'wagmi'

import { formatNumber } from '@/lib/format'
import { useReadErc20BalanceOf } from '@/lib/generated'

export function L2Balance({ base }: { base: `0x${string}` }) {
  const { address } = useAccount()
  const { data: l2Balance } = useReadErc20BalanceOf({
    address: base,
    args: [address ?? '0x'],
    query: {
      enabled: !!base && !!address,
    },
  })
  const formattedL2Balance = formatNumber(
    l2Balance ?? BigInt(0),
    Token.findByAddress(base).decimals,
  )
  return <>{formattedL2Balance}</>
}
