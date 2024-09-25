import * as React from "react"

import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { TaskState, useTaskHistoryWebSocket } from "@renegade-fi/react"
import { AlertCircle, Check, Loader2 } from "lucide-react"

import { useStepper } from "@/components/dialogs/order-stepper/mobile/new-order-stepper"
import { DidYouKnowContent } from "@/components/did-you-know-content"
import { OrderStatusDisplay } from "@/components/order-status-display"
import { DialogDescription } from "@/components/ui/dialog"
import {
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"

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
      <DrawerHeader className="text-left">
        <DrawerTitle className="flex items-center gap-2 font-extended">
          {Icon}
          {title}
        </DrawerTitle>
        <VisuallyHidden>
          <DrawerDescription>Your order has been placed.</DrawerDescription>
        </VisuallyHidden>
      </DrawerHeader>
      <div className="space-y-6 p-6 pb-0">
        <OrderStatusDisplay
          currentStatus={orderStatus}
          states={states}
        />
        <DidYouKnowContent />
      </div>
      <DrawerFooter />
    </>
  )
}
