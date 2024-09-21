import React from "react"

import { Token, UpdateType, useCreateOrder } from "@renegade-fi/react"
import { toast } from "sonner"

import { NewOrderConfirmationProps } from "@/components/dialogs/order-stepper/desktop/new-order-stepper"
import { ConfirmOrderDisplay } from "@/components/dialogs/order-stepper/desktop/steps/default"
import { useStepper } from "@/components/dialogs/order-stepper/mobile/new-order-stepper"
import { Button } from "@/components/ui/button"
import {
  DialogClose,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

import { usePrepareCreateOrder } from "@/hooks/use-prepare-create-order"
import { usePriceQuery } from "@/hooks/use-price-query"
import { constructStartToastMessage } from "@/lib/constants/task"
import { decimalCorrectPrice } from "@/lib/utils"

export function ConfirmStep(props: NewOrderConfirmationProps) {
  const { onNext, setTaskId } = useStepper()

  const baseToken = Token.findByTicker(props.base)
  const quoteToken = Token.findByTicker("USDC")
  const { data: price } = usePriceQuery(baseToken.address)

  const worstCasePrice = React.useMemo(() => {
    if (!price) return 0
    const wcp = price * (props.isSell ? 0.5 : 1.5)
    return decimalCorrectPrice(wcp, baseToken.decimals, quoteToken.decimals)
  }, [baseToken.decimals, price, props.isSell, quoteToken.decimals])

  const { request } = usePrepareCreateOrder({
    base: baseToken.address,
    quote: quoteToken.address,
    side: props.isSell ? "sell" : "buy",
    amount: props.amount,
    worstCasePrice: worstCasePrice.toFixed(18),
  })

  const { createOrder } = useCreateOrder({
    mutation: {
      onSuccess(data) {
        props.onSuccess?.()
        setTaskId(data.taskId)
        onNext()
        const message = constructStartToastMessage(UpdateType.PlaceOrder)
        toast.loading(message, {
          id: data.taskId,
        })
      },
    },
  })

  return (
    <>
      <DialogHeader className="p-6 text-left">
        <DialogTitle className="font-extended">Review Order</DialogTitle>
      </DialogHeader>
      <ScrollArea className="max-h-dvh overflow-auto">
        <div className="space-y-6 p-6">
          <ConfirmOrderDisplay {...props} />
        </div>
      </ScrollArea>
      <DialogFooter className="mt-auto flex-row">
        <DialogClose asChild>
          <Button
            className="flex-1 font-extended text-lg"
            size="xl"
            variant="ghost"
          >
            Close
          </Button>
        </DialogClose>
        <Button
          autoFocus
          className="flex-1 font-extended text-lg"
          size="xl"
          onClick={() => {
            if (request instanceof Error) {
              toast.error(request.message)
              return
            }
            createOrder({ request })
          }}
        >
          {props.isSell ? "Sell" : "Buy"} {props.base}
        </Button>
      </DialogFooter>
    </>
  )
}
