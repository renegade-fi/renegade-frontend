import React from "react"

import { Token, UpdateType, useCreateOrder } from "@renegade-fi/react"
import { Loader2 } from "lucide-react"
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

import { usePrepareCreateOrder } from "@/hooks/use-prepare-create-order"
import { usePriceQuery } from "@/hooks/use-price-query"
import { constructStartToastMessage } from "@/lib/constants/task"
import { decimalCorrectPrice } from "@/lib/utils"

export function ConfirmStep(props: NewOrderConfirmationProps) {
  const [allowExternalMatches, setAllowExternalMatches] = React.useState(false)
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
    allowExternalMatches,
  })

  const { createOrder } = useCreateOrder({
    mutation: {
      onSuccess(data) {
        props.onSuccess?.()
        setTaskId(data.taskId)
        onNext()
        const message = constructStartToastMessage(UpdateType.PlaceOrder)
        toast.success(message, {
          id: data.taskId,
          icon: <Loader2 className="h-4 w-4 animate-spin text-black" />,
        })
      },
    },
  })

  return (
    <>
      <DialogHeader className="px-6 pt-6 text-left">
        <DialogTitle className="font-extended">Review Order</DialogTitle>
      </DialogHeader>
      <div className="flex flex-col gap-6 overflow-y-auto p-6">
        <ConfirmOrderDisplay
          {...props}
          allowExternalMatches={allowExternalMatches}
          setAllowExternalMatches={setAllowExternalMatches}
        />
      </div>
      <DialogFooter className="mt-auto flex-row p-6 pt-0">
        <DialogClose asChild>
          <Button
            className="flex-1 font-extended text-lg"
            size="xl"
            variant="outline"
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
