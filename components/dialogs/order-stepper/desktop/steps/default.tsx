import React from "react"

import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { Token, UpdateType, useCreateOrder } from "@renegade-fi/react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { FeesSection } from "@/app/trade/[base]/components/new-order/fees-sections"
import { NoBalanceSlotWarning } from "@/app/trade/[base]/components/new-order/no-balance-slot-warning"
import { InsufficientWarning } from "@/app/trade/[base]/components/order-details/insufficient-warning"
import { orderFormEvents } from "@/app/trade/[base]/events/order-events"

import {
  NewOrderConfirmationProps,
  useStepper,
} from "@/components/dialogs/order-stepper/desktop/new-order-stepper"
import { TokenIcon } from "@/components/token-icon"
import { Button } from "@/components/ui/button"
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  ResponsiveTooltip,
  ResponsiveTooltipContent,
  ResponsiveTooltipTrigger,
} from "@/components/ui/responsive-tooltip"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

import { useMediaQuery } from "@/hooks/use-media-query"
import { usePrepareCreateOrder } from "@/hooks/use-prepare-create-order"
import { usePriceQuery } from "@/hooks/use-price-query"
import { Side } from "@/lib/constants/protocol"
import { constructStartToastMessage } from "@/lib/constants/task"
import { GAS_FEE_TOOLTIP } from "@/lib/constants/tooltips"
import { formatNumber, safeParseUnits } from "@/lib/format"
import { decimalCorrectPrice } from "@/lib/utils"

export function DefaultStep(props: NewOrderConfirmationProps) {
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
        onNext()
        setTaskId(data.taskId)
        const message = constructStartToastMessage(UpdateType.PlaceOrder)
        toast.success(message, {
          id: data.taskId,
          icon: <Loader2 className="h-4 w-4 animate-spin text-black" />,
        })
        orderFormEvents.emit("reset")
      },
    },
  })

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
          <ConfirmOrderDisplay {...props} />
        </div>
      </ScrollArea>
      <DialogFooter>
        <Button
          autoFocus
          className="flex-1 border-x-0 border-b-0 border-t font-serif text-2xl font-bold"
          size="xl"
          variant="outline"
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

export function ConfirmOrderDisplay({
  base,
  isSell,
  amount,
  onSuccess,
  ...fees
}: NewOrderConfirmationProps) {
  const isDesktop = useMediaQuery("(min-width: 1024px)")
  const token = Token.findByTicker(base)
  const parsedAmount = safeParseUnits(amount, token.decimals)
  const formattedAmount = formatNumber(
    parsedAmount instanceof Error ? BigInt(0) : parsedAmount,
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
          <div >--</div>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-muted-foreground">Type</div>
          <div >Midpoint Peg</div>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-muted-foreground">Est. time to fill</div>
          <div >--</div>
        </div>
      </div> */}
      <Separator />
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <ResponsiveTooltip>
            <ResponsiveTooltipTrigger
              onClick={(e) => isDesktop && e.preventDefault()}
            >
              <span className="text-muted-foreground">Network costs</span>
            </ResponsiveTooltipTrigger>
            <ResponsiveTooltipContent>
              <p>{GAS_FEE_TOOLTIP}</p>
            </ResponsiveTooltipContent>
          </ResponsiveTooltip>
          <div>$0.00</div>
        </div>
        <FeesSection
          amount={amount}
          {...fees}
        />
      </div>
      <NoBalanceSlotWarning
        className="text-sm text-orange-400"
        isSell={isSell}
        ticker={base}
      />
      <InsufficientWarning
        richColors
        amount={parsedAmount instanceof Error ? BigInt(0) : parsedAmount}
        baseMint={token.address}
        className="text-sm text-orange-400"
        quoteMint={Token.findByTicker("USDC").address}
        side={isSell ? Side.SELL : Side.BUY}
      />
    </>
  )
}
