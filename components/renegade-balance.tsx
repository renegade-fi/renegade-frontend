'use client'

import * as React from 'react'

import { Token, useBalances } from '@renegade-fi/react'

import { formatNumber } from '@/lib/format'

export function RenegadeBalance({ base }: { base: `0x${string}` }) {
  const balances = useBalances()
  const formattedRenegadeBalance = formatNumber(
    balances.get(base)?.amount ?? BigInt(0),
    Token.findByAddress(base).decimals,
  )
  return <>{formattedRenegadeBalance}</>
}
