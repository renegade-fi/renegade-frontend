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
import { ExternalMatchesSection } from "@/components/dialogs/order-stepper/external-matches-section"
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
import { useOrderValue } from "@/hooks/use-order-value"
import { usePrepareCreateOrder } from "@/hooks/use-prepare-create-order"
import { usePriceQuery } from "@/hooks/use-price-query"
import { Side } from "@/lib/constants/protocol"
import { constructStartToastMessage } from "@/lib/constants/task"
import { GAS_FEE_TOOLTIP } from "@/lib/constants/tooltips"
import {
  formatCurrencyFromString,
  formatNumber,
  safeParseUnits,
} from "@/lib/format"
import { decimalCorrectPrice } from "@/lib/utils"

export function DefaultStep(
  props: NewOrderConfirmationProps & {
    allowExternalMatches: boolean
    setAllowExternalMatches: (allowExternalMatches: boolean) => void
  },
) {
  const { onNext, setTaskId } = useStepper()

  const baseToken = Token.findByTicker(props.base)
  const quoteToken = Token.findByTicker("USDC")
  const { data: price } = usePriceQuery(baseToken.address)

  const worstCasePrice = React.useMemo(() => {
    if (!price) return 0
    const wcp = price * (props.isSell ? 0.5 : 1.5)
    return decimalCorrectPrice(wcp, baseToken.decimals, quoteToken.decimals)
  }, [baseToken.decimals, price, props.isSell, quoteToken.decimals])

  const { data: request } = usePrepareCreateOrder({
    base: baseToken.address,
    quote: quoteToken.address,
    side: props.isSell ? "sell" : "buy",
    amount: props.amount,
    worstCasePrice: worstCasePrice.toFixed(18),
    allowExternalMatches: props.allowExternalMatches,
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
        <div className="flex flex-col gap-6 p-6">
          <ConfirmOrderDisplay
            {...props}
            allowExternalMatches={props.allowExternalMatches}
            setAllowExternalMatches={props.setAllowExternalMatches}
          />
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

export function ConfirmOrderDisplay(
  props: NewOrderConfirmationProps & {
    allowExternalMatches: boolean
    setAllowExternalMatches: (allowExternalMatches: boolean) => void
  },
) {
  const isDesktop = useMediaQuery("(min-width: 1024px)")
  const token = Token.findByTicker(props.base)
  const parsedAmount = safeParseUnits(props.amount, token.decimals)
  const formattedAmount = formatNumber(
    parsedAmount instanceof Error ? BigInt(0) : parsedAmount,
    token.decimals,
    true,
  )
  const { valueInQuoteCurrency } = useOrderValue({
    ...props,
    isQuoteCurrency: false,
  })
  const formattedValueInQuoteCurrency = Number(valueInQuoteCurrency)
    ? formatCurrencyFromString(valueInQuoteCurrency)
    : "--"
  return (
    <>
      <div className="space-y-3">
        <div className="text-muted-foreground">
          {props.isSell ? "Sell" : "Buy"}
        </div>
        <div className="flex items-center justify-between">
          <div className="font-serif text-3xl font-bold">
            {formattedAmount} {props.base}
          </div>
          <TokenIcon ticker={props.base} />
        </div>
      </div>
      <div className="space-y-3">
        <div className="text-muted-foreground">
          {props.isSell ? "For" : "With"}
        </div>
        <div className="flex items-center justify-between">
          <div className="font-serif text-3xl font-bold">
            ~{formattedValueInQuoteCurrency} USDC
          </div>
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
      <div className="space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <ResponsiveTooltip>
            <ResponsiveTooltipTrigger
              className="cursor-default text-muted-foreground"
              onClick={(e) => isDesktop && e.preventDefault()}
            >
              Network costs
            </ResponsiveTooltipTrigger>
            <ResponsiveTooltipContent>
              {GAS_FEE_TOOLTIP}
            </ResponsiveTooltipContent>
          </ResponsiveTooltip>
          <div>$0.00</div>
        </div>
        <FeesSection {...props} />
      </div>
      <div>
        <ExternalMatchesSection
          {...props}
          allowExternalMatches={props.allowExternalMatches}
          setAllowExternalMatches={props.setAllowExternalMatches}
        />
      </div>
      <NoBalanceSlotWarning
        className="text-sm text-orange-400"
        isSell={props.isSell}
        ticker={props.base}
      />
      <InsufficientWarning
        richColors
        amount={parsedAmount instanceof Error ? BigInt(0) : parsedAmount}
        baseMint={token.address}
        className="text-sm text-orange-400"
        quoteMint={Token.findByTicker("USDC").address}
        side={props.isSell ? Side.SELL : Side.BUY}
      />
    </>
  )
}
