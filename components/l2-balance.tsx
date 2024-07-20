"use client"

import * as React from "react"

import { Token } from "@renegade-fi/react"
import { useAccount } from "wagmi"

import { formatNumber } from "@/lib/format"
import { useReadErc20BalanceOf } from "@/lib/generated"

export function L2Balance({ mint }: { mint: `0x${string}` }) {
  const { address } = useAccount()
  const { data: l2Balance } = useReadErc20BalanceOf({
    address: mint,
    args: [address ?? "0x"],
    query: {
      enabled: !!mint && !!address,
    },
  })
  const formattedL2Balance = formatNumber(
    l2Balance ?? BigInt(0),
    Token.findByAddress(mint).decimals,
  )
  return <>{formattedL2Balance}</>
}
