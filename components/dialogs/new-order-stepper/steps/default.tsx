import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import {
  Token,
  UpdateType,
  parseAmount,
  useCreateOrder,
} from "@renegade-fi/react"
import { toast } from "sonner"
import { parseUnits } from "viem"

import { FeesSection } from "@/app/trade/[base]/components/new-order/fees-sections"
import { InsufficientWarning } from "@/app/trade/[base]/components/order-details/insufficient-warning"

import {
  NewOrderConfirmationProps,
  useStepper,
} from "@/components/dialogs/new-order-stepper/new-order-stepper"
import { TokenIcon } from "@/components/token-icon"
import { Button } from "@/components/ui/button"
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { useMediaQuery } from "@/hooks/use-media-query"
import { usePrepareCreateOrder } from "@/hooks/usePrepareCreateOrder"
import { Side } from "@/lib/constants/protocol"
import { constructStartToastMessage } from "@/lib/constants/task"
import { GAS_FEE_TOOLTIP } from "@/lib/constants/tooltips"
import { formatNumber } from "@/lib/format"

export function DefaultStep(props: NewOrderConfirmationProps) {
  const { onNext, setTaskId } = useStepper()
  const isDesktop = useMediaQuery("(min-width: 768px)")

  const baseToken = Token.findByTicker(props.base)
  const quoteToken = Token.findByTicker("USDC")
  const parsedAmount = parseAmount(props.amount.toString(), baseToken)

  const { request } = usePrepareCreateOrder({
    base: baseToken.address,
    quote: quoteToken.address,
    side: props.isSell ? "sell" : "buy",
    amount: parsedAmount,
  })

  const { createOrder } = useCreateOrder({
    mutation: {
      onSuccess(data) {
        props.onSuccess?.()
        onNext()
        setTaskId(data.taskId)
        const message = constructStartToastMessage(UpdateType.PlaceOrder)
        toast.loading(message, {
          id: data.taskId,
        })
      },
    },
  })

  if (isDesktop) {
    return (
      <>
        <DialogHeader className="space-y-4 px-6 pt-6">
          <DialogTitle className="font-extended">Review Order</DialogTitle>
          <VisuallyHidden>
            <DialogDescription>
              Review your order before placing it.
            </DialogDescription>
          </VisuallyHidden>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh]">
          <div className="space-y-6 p-6">
            <NewOrderForm {...props} />
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button
            autoFocus
            onClick={() => createOrder({ request })}
            variant="outline"
            className="flex-1 border-x-0 border-b-0 border-t font-serif text-2xl font-bold"
            size="xl"
          >
            {props.isSell ? "Sell" : "Buy"} {props.base}
          </Button>
        </DialogFooter>
      </>
    )
  }

  return (
    <>
      <DrawerHeader className="text-left">
        <DrawerTitle className="font-extended">Review Order</DrawerTitle>
      </DrawerHeader>
      <ScrollArea className="max-h-[60vh] overflow-auto">
        <div className="space-y-6 p-4">
          <NewOrderForm {...props} />
        </div>
      </ScrollArea>
      <DrawerFooter className="pt-2">
        <Button autoFocus variant="outline" onClick={onNext}>
          {props.isSell ? "Sell" : "Buy"} {props.base}
        </Button>
      </DrawerFooter>
    </>
  )
}

function NewOrderForm({
  base,
  isSell,
  amount,
  onSuccess,
  ...fees
}: NewOrderConfirmationProps) {
  const token = Token.findByTicker(base)
  const formattedAmount = formatNumber(
    parseUnits(amount.toString(), token.decimals),
    token.decimals,
    true,
  )
  return (
    <>
      <div className="space-y-3">
        <div className="text-muted-foreground">{isSell ? "Sell" : "Buy"}</div>
        <div className="flex items-center justify-between">
          <div className="font-serif text-3xl font-bold">
            {formattedAmount} {base}
          </div>
          <TokenIcon ticker={base} />
        </div>
      </div>
      <div className="space-y-3">
        <div className="text-muted-foreground">{isSell ? "For" : "With"}</div>
        <div className="flex items-center justify-between">
          <div className="font-serif text-3xl font-bold">USDC</div>
          <TokenIcon ticker="USDC" />
        </div>
      </div>
      {/* <Separator />
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-muted-foreground">Receive at least</div>
          <div className="">--</div>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-muted-foreground">Type</div>
          <div className="">Midpoint Peg</div>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-muted-foreground">Est. time to fill</div>
          <div className="">--</div>
        </div>
      </div> */}
      <Separator />
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Tooltip>
            <TooltipTrigger onClick={e => e.preventDefault()}>
              <span className="text-muted-foreground">Network costs</span>
            </TooltipTrigger>
            <TooltipContent>
              <p>{GAS_FEE_TOOLTIP}</p>
            </TooltipContent>
          </Tooltip>
          <div>$0.00</div>
        </div>
        <FeesSection amount={amount} {...fees} />
      </div>
      <InsufficientWarning
        amount={parseAmount(amount.toString(), token)}
        baseMint={token.address}
        className="text-sm text-orange-400"
        quoteMint={Token.findByTicker("USDC").address}
        richColors
        side={isSell ? Side.SELL : Side.BUY}
      />
    </>
  )
}
