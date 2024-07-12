import {
  Token,
  parseAmount,
  useConfig,
  useTaskHistory,
} from '@renegade-fi/react'
import { createOrder } from '@renegade-fi/react/actions'
import { toast } from 'sonner'
import invariant from 'tiny-invariant'
import { v4 as uuidv4 } from 'uuid'

import {
  FAILED_PLACE_ORDER_MSG,
  QUEUED_PLACE_ORDER_MSG,
} from '@/lib/constants/task'

export function useCreateOrder({
  base,
  quote = 'USDC',
  side,
  amount,
  setOpen,
  clearAmount,
}: {
  base: string
  quote?: string
  side: string
  amount: string
  setOpen: (open: boolean) => void
  clearAmount: () => void
}) {
  invariant(side === 'buy' || side === 'sell', 'Invalid side')
  const config = useConfig()

  const { data: taskHistory } = useTaskHistory()
  const isQueue = Array.from(taskHistory?.values() || []).find(
    task => task.state !== 'Completed' && task.state !== 'Failed',
  )
  return async () => {
    const baseToken = Token.findByTicker(base)
    const quoteToken = Token.findByTicker(quote)
    const id = uuidv4()
    const parsedAmount = parseAmount(amount, baseToken)
    if (isQueue) {
      toast.message(QUEUED_PLACE_ORDER_MSG(baseToken, parsedAmount, side))
    }
    await createOrder(config, {
      id,
      base: baseToken.address,
      quote: quoteToken.address,
      side: side === 'buy' ? 'buy' : 'sell',
      amount: parsedAmount,
    }).catch(e => {
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
    setOpen(false)
    clearAmount()
  }
}
