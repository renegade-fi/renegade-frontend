import { useState } from "react"

import { usePathname, useRouter } from "next/navigation"

import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import {
  Task,
  TaskState,
  TaskType,
  UpdateType,
  useTaskHistory,
} from "@renegade-fi/react"
import { Token } from "@renegade-fi/token-nextjs"

import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

import { formatNumber, formatRelativeTimestamp } from "@/lib/format"

export function TaskHistorySheet({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const { data } = useTaskHistory()
  const content = Array.from(data?.values() || []).map(deriveContent)
  return (
    <Sheet
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="p-0 sm:w-[404px] sm:max-w-[404px]">
        <SheetHeader>
          <VisuallyHidden>
            <SheetTitle>Task History</SheetTitle>
            <SheetDescription>View task history</SheetDescription>
          </VisuallyHidden>
        </SheetHeader>
        <ScrollArea className="h-full p-6">
          <div className="flex flex-col gap-[14px]">
            {content.map((c, index) => {
              return (
                <div
                  key={index}
                  className={c.href ? "cursor-pointer hover:bg-muted/50" : ""}
                  onClick={() => {
                    if (pathname === c.href) {
                      setIsOpen(false)
                    }
                    if (c.href) {
                      router.push(c.href)
                    }
                  }}
                >
                  <TaskItem {...c} />
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

function TaskItem({
  title,
  description,
  timestamp,
  status,
}: {
  title: string
  description: string
  timestamp: number
  status: string
}) {
  return (
    <div className="flex items-center gap-1.5 rounded-md border border-border p-4 text-sm shadow-md">
      <div className="flex w-full justify-between">
        <div className="flex flex-col gap-[2px]">
          <div className="flex justify-between font-medium leading-6 text-inherit">
            {title}
          </div>
          <div className="flex justify-between font-normal leading-5 text-inherit">
            {description}
          </div>
        </div>

        <div className="flex flex-col gap-[2px]">
          <div className="font-medium leading-6 text-muted-foreground">
            {status}
          </div>
          <div className="font-normal leading-5 text-muted-foreground">
            {formatRelativeTimestamp(timestamp)}
          </div>
        </div>
      </div>
    </div>
  )
}

const remapUpdateType = {
  [UpdateType.Deposit]: "Deposit",
  [UpdateType.Withdraw]: "Withdraw",
  [UpdateType.PlaceOrder]: "Place Order",
  [UpdateType.CancelOrder]: "Cancel Order",
}

const remapStates: Record<TaskState, string> = {
  ["Queued"]: "Queued",
  ["Running"]: "In Progress",
  ["Proving"]: "Proving",
  ["Proving Payment"]: "Proving",
  ["Submitting Tx"]: "Submitting Tx",
  ["Submitting Payment"]: "Submitting Tx",
  ["Finding Opening"]: "Indexing",
  ["Updating Validity Proofs"]: "Updating",
  ["Completed"]: "Completed",
  ["Failed"]: "Failed",
}

function deriveContent(task: Task): {
  title: string
  description: string
  timestamp: number
  tooltip?: string
  status: string
  href?: string
} {
  let content = {
    title: "",
    description: "",
    timestamp: Number(task.created_at),
    status: remapStates[task.state],
  }
  switch (task.task_info.task_type) {
    case TaskType.NewWallet:
      return { ...content, title: "New Wallet" }
    case TaskType.PayOfflineFee:
      return { ...content, title: "Pay Fee" }
    case TaskType.UpdateWallet:
      switch (task.task_info.update_type) {
        case UpdateType.Deposit:
        case UpdateType.Withdraw:
          const token = Token.findByAddress(task.task_info.mint)
          return {
            ...content,
            title: remapUpdateType[task.task_info.update_type],
            description: `${formatNumber(
              task.task_info.amount,
              token.decimals,
            )} ${token.ticker}`,
            tooltip: "View in Assets",
            href: `/assets`,
          }
        case UpdateType.PlaceOrder:
        case UpdateType.CancelOrder:
          const base = Token.findByAddress(task.task_info.base)
          return {
            ...content,
            title: remapUpdateType[task.task_info.update_type],
            description: `${task.task_info.side} ${formatNumber(
              task.task_info.amount,
              base.decimals,
            )} ${base.ticker}`,
            tooltip: "View in Orders",
          }
        default:
          return content
      }
    case TaskType.SettleMatch:
      const base = Token.findByAddress(task.task_info.base)
      return {
        ...content,
        title: "Settle Match",
        description: `${task.task_info.is_sell ? "Sell" : "Buy"} ${formatNumber(
          task.task_info.volume,
          base.decimals,
        )} ${base.ticker}`,
        tooltip: "View Fill",
      }
    default:
      return content
  }
}
