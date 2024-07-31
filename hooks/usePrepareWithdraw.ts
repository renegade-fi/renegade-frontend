"use client"

import React from "react"

import {
  Token,
  parseAmount,
  stringifyForWasm,
  useBackOfQueueWallet,
  useConfig,
} from "@renegade-fi/react"
import { isAddress, toHex } from "viem/utils"

export type UsePrepareWithdrawParameters = {
  mint?: string
  amount?: number | bigint
  destinationAddr?: string
  enabled?: boolean
}

export type UsePrepareWithdrawReturnType =
  | {
      request: string
      mint: `0x${string}`
    }
  | undefined

export function usePrepareWithdraw(
  parameters: UsePrepareWithdrawParameters,
): UsePrepareWithdrawReturnType {
  const { mint, amount, destinationAddr, enabled = true } = parameters
  const config = useConfig()
  const { data: wallet, isSuccess } = useBackOfQueueWallet()

  const request = React.useMemo(() => {
    if (!isSuccess || !mint || !amount || !destinationAddr || !enabled)
      return undefined
    if (!isAddress(mint) || !isAddress(destinationAddr)) return undefined

    const token = Token.findByAddress(mint)
    let parsedAmount: bigint
    if (typeof amount === "number") {
      parsedAmount = parseAmount(amount.toString(), token)
    } else {
      parsedAmount = amount
    }

    return {
      request: config.utils.withdraw(
        stringifyForWasm(wallet),
        mint,
        toHex(parsedAmount),
        destinationAddr,
      ),
      mint,
    }
  }, [config, wallet, mint, amount, destinationAddr, isSuccess, enabled])

  return request
}
