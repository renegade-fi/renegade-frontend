import * as React from "react"

import { TaskState } from "@renegade-fi/react"
import { Check, Loader2 } from "lucide-react"

import { formatTaskState } from "@/lib/constants/task"
import { cn } from "@/lib/utils"

interface OrderStatusDisplayProps {
  states: TaskState[]
  currentStatus: TaskState
}

export function OrderStatusDisplay({
  states,
  currentStatus,
}: OrderStatusDisplayProps) {
  return (
    <div className="space-y-1 border p-4 font-mono">
      {states.map((state, i) => (
        <div
          key={state}
          className={cn(
            "flex items-center justify-between transition-colors hover:text-primary",
            {
              "animate-pulse":
                currentStatus === state && currentStatus !== "Completed",
              "text-muted": currentStatus !== state,
            },
          )}
        >
          {i + 1}. {formatTaskState(state)}{" "}
          {currentStatus === state && currentStatus !== "Completed" && (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}
          {currentStatus === "Completed" &&
            i === states.indexOf(currentStatus) && (
              <Check className="h-4 w-4" />
            )}
          {states.indexOf(currentStatus) > i && <Check className="h-4 w-4" />}
        </div>
      ))}
    </div>
  )
}
