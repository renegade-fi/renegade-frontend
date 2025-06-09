import React from "react"

import { UpdateType } from "@renegade-fi/react"
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

import { useCreateOrder } from "@/hooks/mutation/use-create-order"
import { usePrepareCreateOrder } from "@/hooks/use-prepare-create-order"
import { usePriceQuery } from "@/hooks/use-price-query"
import { constructStartToastMessage } from "@/lib/constants/task"
import { resolveAddress } from "@/lib/token"
import { decimalCorrectPrice } from "@/lib/utils"
import { useServerStore } from "@/providers/state-provider/server-store-provider"

export function ConfirmStep(props: NewOrderConfirmationProps) {
  const [allowExternalMatches, setAllowExternalMatches] = React.useState(false)
  const { onNext, setTaskId } = useStepper()

  const baseToken = resolveAddress(props.base)
  const quoteMint = useServerStore((state) => state.quoteMint)
  const quoteToken = resolveAddress(quoteMint)
  const { data: price } = usePriceQuery(props.base)

  const worstCasePrice = React.useMemo(() => {
    if (!price) return 0
    const wcp = price * (props.isSell ? 0.5 : 1.5)
    return decimalCorrectPrice(wcp, baseToken.decimals, quoteToken.decimals)
  }, [baseToken.decimals, price, props.isSell, quoteToken.decimals])

  const { data: request } = usePrepareCreateOrder({
    base: props.base,
    quote: quoteMint,
    side: props.isSell ? "sell" : "buy",
    amount: props.amount,
    worstCasePrice: worstCasePrice.toFixed(18),
    allowExternalMatches,
  })

  const { mutate: createOrder } = useCreateOrder({
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
          {props.isSell ? "Sell" : "Buy"} {baseToken.ticker}
        </Button>
      </DialogFooter>
    </>
  )
}
