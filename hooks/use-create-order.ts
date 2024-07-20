"use client"

import {
  Token,
  parseAmount,
  useConfig,
  useTaskHistory,
} from "@renegade-fi/react"
import { createOrder } from "@renegade-fi/react/actions"
import { toast } from "sonner"
import { v4 as uuidv4 } from "uuid"

import { Side } from "@/lib/constants/protocol"
import {
  FAILED_PLACE_ORDER_MSG,
  QUEUED_PLACE_ORDER_MSG,
} from "@/lib/constants/task"

export function useCreateOrder({
  base,
  quote = "USDC",
  side,
  amount,
}: {
  base: string
  quote?: string
  side: Side
  amount: string
}) {
  const config = useConfig()

  const { data: taskHistory } = useTaskHistory()
  const isQueue = Array.from(taskHistory?.values() || []).find(
    task => task.state !== "Completed" && task.state !== "Failed",
  )
  async function handleCreateOrder({ onSuccess }: { onSuccess?: () => void }) {
    const baseToken = Token.findByTicker(base)
    const quoteToken = Token.findByTicker(quote)
    const id = uuidv4()
    const parsedAmount = parseAmount(amount, baseToken)
    if (isQueue) {
      toast.message(QUEUED_PLACE_ORDER_MSG(baseToken, parsedAmount, side))
    }
    return createOrder(config, {
      id,
      base: baseToken.address,
      quote: quoteToken.address,
      side: side === Side.BUY ? Side.BUY : Side.SELL,
      amount: parsedAmount,
    })
      .then(onSuccess)
      .catch(e => {
        toast.error(
          FAILED_PLACE_ORDER_MSG(
            baseToken,
            parsedAmount,
            side,
            e.shortMessage ?? e.response.data,
          ),
        )
        console.error(`Error placing order: ${e.response?.data ?? e.message}`)
      })
  }
  return { handleCreateOrder }
}
