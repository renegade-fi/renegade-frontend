"use client"

import React from "react"

import {
  useBackOfQueueWallet,
  stringifyForWasm,
  useConfig,
} from "@renegade-fi/react"
import { CreateOrderParameters } from "@renegade-fi/react/actions"
import { MAX_ORDERS } from "@renegade-fi/react/constants"
import { toHex } from "viem"

export type UsePrepareCreateOrderParameters = CreateOrderParameters

export type UsePrepareCreateOrderReturnType = {
  request: string
}

export function usePrepareCreateOrder(
  parameters: UsePrepareCreateOrderParameters,
) {
  const { id = "", base, quote, side, amount } = parameters
  const config = useConfig()
  const { data: wallet, isSuccess } = useBackOfQueueWallet()
  const request = React.useMemo(() => {
    if (!isSuccess) return ""
    if (wallet.orders.filter(order => order.amount).length >= MAX_ORDERS)
      return ""
    return config.utils.new_order(
      stringifyForWasm(wallet),
      id,
      base,
      quote,
      side,
      toHex(amount),
    )
  }, [config, wallet, id, base, quote, side, amount, isSuccess])
  return { request }
}
