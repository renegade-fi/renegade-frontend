import * as React from "react"

import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { useTaskHistoryWebSocket } from "@renegade-fi/react"
import { AlertCircle, Check, Loader2, Repeat } from "lucide-react"

import { useStepper } from "@/components/dialogs/new-order-stepper/new-order-stepper"
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

import { useMediaQuery } from "@/hooks/use-media-query"

export function SuccessStepWithoutSavings() {
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

  const Icon = {
    success: <Check className="h-6 w-6" />,
    pending: <Loader2 className="h-6 w-6 animate-spin" />,
    error: <AlertCircle className="h-6 w-6" />,
  }[status]

  const title = {
    success: "Order Placed",
    pending: "Placing Order",
    error: "Failed to Place Order",
  }[status]

  if (isDesktop) {
    return (
      <>
        <DialogHeader className="space-y-4 px-6 pt-6">
          <DialogTitle className="flex items-center gap-2 font-extended">
            {Icon}
            {title}
          </DialogTitle>
          <VisuallyHidden>
            <DialogDescription>Your order has been placed.</DialogDescription>
          </VisuallyHidden>
        </DialogHeader>
        <div className="space-y-6 p-6">
          <OrderSuccessSection />
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
        <DrawerTitle className="font-extended">Order Placed</DrawerTitle>
      </DrawerHeader>
      <ScrollArea className="max-h-[60vh] overflow-auto">
        <div className="space-y-6 p-4">
          <OrderSuccessSection />
        </div>
      </ScrollArea>
      <DrawerFooter className="pt-2">
        <DrawerClose asChild>
          <Button
            autoFocus
            variant="outline"
          >
            Close
          </Button>
        </DrawerClose>
      </DrawerFooter>
    </>
  )
}

function OrderSuccessSection() {
  return (
    <>
      <div className="border p-4 text-sm text-muted-foreground">
        <div className="flex items-start justify-between">
          Did you know?
          <Button
            size="icon"
            variant="ghost"
            className="rounded-none"
          >
            <Repeat className="h-4 w-4" />
          </Button>
        </div>
        <div>All trades are pre-trade and post-trade private.</div>
      </div>
      {/* <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Checkbox id="donot-show-again" />
        <label
          htmlFor="donot-show-again"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Don&apos;t show again
        </label>
      </div> */}
    </>
  )
}
