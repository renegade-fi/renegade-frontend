import * as React from "react"

import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { useTaskHistoryWebSocket } from "@renegade-fi/react"
import { Repeat } from "lucide-react"

import {
  NewOrderConfirmationProps,
  useStepper,
} from "@/components/dialogs/new-order-stepper/new-order-stepper"
import { GlowText } from "@/components/glow-text"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import { Spinner } from "@/components/ui/spinner"

import { useMediaQuery } from "@/hooks/use-media-query"
import { formatCurrency } from "@/lib/format"

export function SuccessStep(props: NewOrderConfirmationProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)")
  const { taskId } = useStepper()
  const [status, setStatus] = React.useState<"pending" | "success" | "error">(
    "pending",
  )

  useTaskHistoryWebSocket({
    onUpdate(task) {
      if (task.id === taskId) {
        if (task.state === "Completed") {
          setStatus("success")
        } else if (task.state === "Failed") {
          setStatus("error")
        }
      }
    },
  })

  const title =
    status === "pending"
      ? "Placing Order"
      : status === "success"
        ? "Order Placed"
        : "Failed to Place Order"
  const description =
    status === "pending"
      ? "Your order is being placed."
      : status === "success"
        ? "Your order has been placed."
        : "Your order has failed."

  if (isDesktop) {
    return (
      <>
        <DialogHeader className="space-y-4 px-6 pt-6">
          <DialogTitle className="flex items-center font-extended">
            {title}
            {status === "pending" && <Spinner className="ml-2 h-5 w-5" />}
          </DialogTitle>
          <VisuallyHidden>
            <DialogDescription>{description}</DialogDescription>
          </VisuallyHidden>
        </DialogHeader>
        <div className="space-y-6 p-6">
          <OrderSuccessSection {...props} />
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
        <DrawerTitle className="font-extended">{title}</DrawerTitle>
      </DrawerHeader>
      <ScrollArea className="max-h-[60vh] overflow-auto">
        <div className="space-y-6 p-4">
          <OrderSuccessSection {...props} />
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

function OrderSuccessSection({ predictedSavings }: NewOrderConfirmationProps) {
  const savingsLabel = predictedSavings
    ? formatCurrency(predictedSavings)
    : "--"
  return (
    <>
      <div className="flex flex-col items-center space-y-4 text-pretty text-center">
        <div>You&apos;re estimated to save</div>
        <GlowText
          enabled={!!predictedSavings && savingsLabel !== "$0.00"}
          className="bg-green-price text-4xl"
          text={savingsLabel}
        />
        <div>when your order fills at the realtime Binance midpoint price.</div>
      </div>
      <div className="border p-4 text-sm text-muted-foreground">
        <div className="flex items-start justify-between">
          Did you know?
          <Button size="icon" variant="ghost" className="rounded-none">
            <Repeat className="h-4 w-4" />
          </Button>
        </div>
        <div>All trades are pre-trade and post-trade private.</div>
      </div>
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Checkbox id="donot-show-again" />
        <label
          htmlFor="donot-show-again"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Don&apos;t show again
        </label>
      </div>
    </>
  )
}
