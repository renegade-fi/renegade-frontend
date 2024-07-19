import * as React from "react"

import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { Repeat } from "lucide-react"

import { NewOrderProps } from "@/components/dialogs/new-order-stepper/new-order-stepper"
import { GlowText } from "@/components/glow-text"
import { Button } from "@/components/ui/button"
import {
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DrawerClose,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

import { useCreateOrder } from "@/hooks/use-create-order"
import { useMediaQuery } from "@/hooks/use-media-query"

export function SuccessStep({
  base,
  isSell,
  amount,
  onSuccess,
}: NewOrderProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)")

  if (isDesktop) {
    return (
      <>
        <DialogHeader className="space-y-4 px-6 pt-6">
          <DialogTitle className="font-extended">Order Placed</DialogTitle>
          <VisuallyHidden>
            <DialogDescription>Order successfully placed.</DialogDescription>
          </VisuallyHidden>
        </DialogHeader>
        <div className="space-y-6 p-6">
          <NewOrderForm
            base={base}
            side={isSell ? "sell" : "buy"}
            amount={amount.toString()}
            className="p-6"
          />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button
              autoFocus
              variant="outline"
              className="flex-1 border-x-0 border-b-0 border-t font-extended text-2xl"
              size="xl"
            >
              Close
            </Button>
          </DialogClose>
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
          <NewOrderForm
            base={base}
            side={isSell ? "sell" : "buy"}
            amount={amount.toString()}
            className="p-6"
          />
        </div>
      </ScrollArea>
      <DrawerFooter className="pt-2">
        <DrawerClose asChild>
          <Button autoFocus variant="outline">
            Close
          </Button>
        </DrawerClose>
      </DrawerFooter>
    </>
  )
}

function NewOrderForm({
  base,
  side,
  amount,
}: React.ComponentProps<"form"> & {
  base: string
  side: string
  amount: string
}) {
  return (
    <>
      <div className="flex flex-col items-center space-y-4 text-pretty text-center">
        <div>You&apos;re estimated to save</div>
        <GlowText
          className="bg-green-price text-center text-4xl"
          text={"$10.87"}
        />
        <div>when your order fills at the realtime Binance midpoint price.</div>
      </div>
      <Separator />
      <div className="text-sm text-muted-foreground">
        <div className="flex items-center justify-between">
          Did you know?
          <Button size="icon" variant="ghost">
            <Repeat className="h-4 w-4" />
          </Button>
        </div>
        <div>All trades are pre-trade and post-trade private.</div>
      </div>
    </>
  )
}
