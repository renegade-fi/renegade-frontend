import * as React from "react"

import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { TaskState, useTaskHistoryWebSocket } from "@renegade-fi/react"
import { AlertCircle, Check, Loader2, Repeat } from "lucide-react"

import { useStepper } from "@/components/dialogs/new-order-stepper/new-order-stepper"
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

import { useMediaQuery } from "@/hooks/use-media-query"
import { formatTaskState } from "@/lib/constants/task"
import { cn } from "@/lib/utils"

const states: TaskState[] = [
  "Proving",
  "Submitting Tx",
  "Finding Opening",
  "Updating Validity Proofs",
  "Completed",
]

export function SuccessStepWithoutSavings() {
  const isDesktop = useMediaQuery("(min-width: 768px)")
  const { taskId } = useStepper()
  const [status, setStatus] = React.useState<"pending" | "success" | "error">(
    "pending",
  )
  const [orderStatus, setOrderStatus] = React.useState<TaskState>("Proving")
  const formattedOrderStatus = orderStatus
    ? formatTaskState(orderStatus)
    : undefined

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
          <div className="space-y-1 border p-4 font-mono">
            {states.map((state, i) => (
              <div
                key={state}
                className={cn(
                  "flex items-center justify-between transition-colors hover:text-primary",
                  {
                    "animate-pulse":
                      orderStatus === state && orderStatus !== "Completed",
                    "text-muted": orderStatus !== state,
                  },
                )}
              >
                {i + 1}. {formatTaskState(state)}{" "}
                {orderStatus === state && orderStatus !== "Completed" && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {orderStatus === "Completed" &&
                  i === states.indexOf(orderStatus) && (
                    <Check className="h-4 w-4" />
                  )}
                {states.indexOf(orderStatus) > i && (
                  <Check className="h-4 w-4" />
                )}
              </div>
            ))}
          </div>

          <OrderSuccessSection />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button
              autoFocus
              className="flex-1 border-x-0 border-b-0 border-t font-extended text-2xl"
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

const DID_YOU_KNOW_CONTENT = [
  {
    text: "All trades are pre-trade and post-trade private.",
    link: "https://help.renegade.fi/hc/en-us/articles/32760870056723-What-is-pre-trade-and-post-trade-privacy",
  },
  {
    text: "All trades clear at the midpoint of the Binance bid-ask spread.",
    link: "https://help.renegade.fi/hc/en-us/articles/32530574872211-What-is-a-midpoint-peg",
  },
  {
    text: "Trading in Renegade has zero MEV, slippage, or price impact.",
    link: "https://help.renegade.fi/hc/en-us/articles/32762213393043-Does-Renegade-really-have-zero-MEV-copy-trading-slippage-or-price-impact",
  },
] as const

function OrderSuccessSection() {
  const [randomContent, setRandomContent] = React.useState(() => {
    const randomIndex = Math.floor(Math.random() * DID_YOU_KNOW_CONTENT.length)
    return DID_YOU_KNOW_CONTENT[randomIndex]
  })

  const handleRefresh = () => {
    let newIndex: number
    do {
      newIndex = Math.floor(Math.random() * DID_YOU_KNOW_CONTENT.length)
    } while (DID_YOU_KNOW_CONTENT[newIndex] === randomContent)
    setRandomContent(DID_YOU_KNOW_CONTENT[newIndex])
  }

  return (
    <>
      <div className="space-y-2 border p-4 pt-2 text-sm text-muted-foreground">
        <div className="flex items-center justify-between">
          Did you know?
          <Button
            className="rounded-none"
            size="icon"
            variant="ghost"
            onClick={handleRefresh}
          >
            <Repeat className="h-4 w-4" />
          </Button>
        </div>
        <Button
          asChild
          className="text-pretty p-0 text-sm text-muted-foreground"
          variant="link"
        >
          <a
            href={randomContent.link}
            rel="noreferrer"
            target="_blank"
          >
            {randomContent.text}
          </a>
        </Button>
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
