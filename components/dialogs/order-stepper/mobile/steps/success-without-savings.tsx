import * as React from "react"

import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { TaskState, useTaskHistoryWebSocket } from "@renegade-fi/react"
import { AlertCircle, Check, Loader2 } from "lucide-react"

import { useStepper } from "@/components/dialogs/order-stepper/mobile/new-order-stepper"
import { DidYouKnowContent } from "@/components/did-you-know-content"
import { OrderStatusDisplay } from "@/components/order-status-display"
import { Button } from "@/components/ui/button"
import {
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const states: TaskState[] = [
  "Proving",
  "Submitting Tx",
  "Finding Opening",
  "Updating Validity Proofs",
  "Completed",
]

export function SuccessStepWithoutSavings() {
  const { taskId } = useStepper()
  const [status, setStatus] = React.useState<"pending" | "success" | "error">(
    "pending",
  )
  const [orderStatus, setOrderStatus] = React.useState<TaskState>("Proving")

  useTaskHistoryWebSocket({
    onUpdate(task) {
      if (task.id === taskId) {
        if (task.state === "Completed") {
          setStatus("success")
        } else if (task.state === "Failed") {
          setStatus("error")
        }
        setOrderStatus(task.state)
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

  return (
    <>
      <DialogHeader className="mt-[90px] text-left">
        <DialogTitle className="flex items-center gap-2 p-6 font-extended">
          {Icon}
          {title}
        </DialogTitle>
        <VisuallyHidden>
          <DialogDescription>Your order has been placed.</DialogDescription>
        </VisuallyHidden>
      </DialogHeader>
      <div className="space-y-6 overflow-y-auto px-6">
        <OrderStatusDisplay
          currentStatus={orderStatus}
          states={states}
        />
        <DidYouKnowContent />
      </div>
      <DialogFooter className="mt-auto p-6 pt-0">
        <DialogClose asChild>
          <Button
            className="font-extended text-lg"
            size="xl"
            variant="outline"
          >
            Close
          </Button>
        </DialogClose>
      </DialogFooter>
    </>
  )
}
