import * as React from "react"

import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { Token } from "@renegade-fi/react"
import { parseUnits } from "viem"

import { FeesSection } from "@/app/trade/[base]/components/new-order/fees-sections"

import {
  NewOrderProps,
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

import { useCreateOrder } from "@/hooks/use-create-order"
import { useMediaQuery } from "@/hooks/use-media-query"
import { Side } from "@/lib/constants/protocol"
import { formatNumber } from "@/lib/format"

export function DefaultStep(props: NewOrderProps) {
  const { onNext } = useStepper()
  const isDesktop = useMediaQuery("(min-width: 768px)")

  const { handleCreateOrder } = useCreateOrder({
    base: props.base,
    side: props.isSell ? Side.SELL : Side.BUY,
    amount: props.amount.toString(),
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
            onClick={() =>
              handleCreateOrder({
                onSuccess: () => {
                  props.onSuccess?.()
                  onNext()
                },
              })
            }
            variant="outline"
            className="flex-1 border-x-0 border-b-0 border-t font-extended text-2xl"
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
}: NewOrderProps) {
  const { decimals } = Token.findByTicker(base)
  const formattedAmount = formatNumber(
    parseUnits(amount.toString(), decimals),
    decimals,
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
          <TokenIcon ticker="WETH" />
        </div>
      </div>
      <div className="space-y-3">
        <div className="text-muted-foreground">{isSell ? "With" : "For"}</div>
        <div className="flex items-center justify-between">
          <div className="font-serif text-3xl font-bold">USDC</div>
          <TokenIcon ticker="USDC" />
        </div>
      </div>
      <Separator />
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
      </div>
      <Separator />
      <div className="space-y-3">
        <FeesSection {...fees} />
      </div>
    </>
  )
}
