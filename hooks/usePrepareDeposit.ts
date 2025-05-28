"use client"

import React from "react"

import {
  ConfigRequiredError,
  stringifyForWasm,
  useBackOfQueueWallet,
  useConfig,
} from "@renegade-fi/react"
import { Token } from "@renegade-fi/token-nextjs"
import { isAddress, isHex, parseUnits, toHex } from "viem"

export type UsePrepareDepositParameters = {
  amount?: number | bigint
  fromAddr?: string
  mint?: string
  permit?: `0x${string}`
  permitDeadline?: bigint
  permitNonce?: bigint
}

export type UsePrepareDepositReturnType = {
  request: string | undefined
}

export function usePrepareDeposit(parameters: UsePrepareDepositParameters) {
  const { amount, fromAddr, mint, permit, permitDeadline, permitNonce } =
    parameters
  const config = useConfig()
  const { data: wallet, isSuccess } = useBackOfQueueWallet()
  const request = React.useMemo(() => {
    if (!config) throw new ConfigRequiredError("usePrepareDeposit")
    if (!isSuccess) return undefined
    if (
      !amount ||
      !fromAddr ||
      !mint ||
      !permit ||
      !permitDeadline ||
      !permitNonce
    )
      return undefined
    if (!isAddress(mint) || !isAddress(fromAddr) || !isHex(permit))
      return undefined

    const token = Token.findByAddress(mint)
    let parsedAmount: bigint
    if (typeof amount === "number") {
      parsedAmount = parseUnits(amount.toString(), token.decimals)
    } else {
      parsedAmount = amount
    }

    return config.utils.deposit(
      stringifyForWasm(wallet),
      fromAddr,
      mint,
      toHex(parsedAmount),
      toHex(permitNonce),
      toHex(permitDeadline),
      permit,
    )
  }, [
    config,
    wallet,
    fromAddr,
    mint,
    amount,
    permitNonce,
    permitDeadline,
    permit,
    isSuccess,
  ])
  return { request }
}
