"use client"

import React from "react"

import { ConfigRequiredError } from "@renegade-fi/react"
import { isAddress, parseUnits, toHex } from "viem/utils"

import { useBackOfQueueWallet } from "@/hooks/query/use-back-of-queue-wallet"
import { resolveAddress } from "@/lib/token"
import { useConfig } from "@/providers/renegade-provider/config-provider"

import { stringifyForWasm } from "./query/utils"

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
    if (!config) throw new ConfigRequiredError("usePrepareWithdraw")
    if (!isSuccess || !mint || !amount || !destinationAddr || !enabled)
      return undefined
    if (!isAddress(mint) || !isAddress(destinationAddr)) return undefined

    const token = resolveAddress(mint)
    let parsedAmount: bigint
    if (typeof amount === "number") {
      parsedAmount = parseUnits(amount.toString(), token.decimals)
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
