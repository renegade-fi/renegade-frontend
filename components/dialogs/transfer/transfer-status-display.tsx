import React from "react"

import { TaskState } from "@renegade-fi/react"
import { MutationStatus } from "@tanstack/react-query"
import { Check, Loader2 } from "lucide-react"

import { AnimatedEllipsis } from "@/app/components/animated-ellipsis"

import { formatTaskState } from "@/lib/constants/task"
import { cn } from "@/lib/utils"

type StepStatus = {
  status: MutationStatus | undefined
  confirmationStatus?: "error" | "pending" | "success"
  taskStatus?: TaskState
}

export function TransferStatusDisplay({
  steps,
  currentStep,
  statuses,
}: {
  steps: string[]
  currentStep: number
  statuses: StepStatus[]
}) {
  return (
    <div className="cursor-default space-y-1">
      {steps.map((step, i) => {
        const { status, confirmationStatus, taskStatus } = statuses[i]
        const isCurrentStep = currentStep === i
        const isPending =
          status === "pending" ||
          confirmationStatus === "pending" ||
          (taskStatus && taskStatus !== "Completed" && taskStatus !== "Failed")
        const isSuccess =
          (status === "success" && confirmationStatus === "success") ||
          taskStatus === "Completed"

        return (
          <React.Fragment key={step}>
            <div
              className={cn(
                "flex items-center justify-between transition-colors hover:text-primary",
                {
                  "text-muted": !isCurrentStep && !isSuccess,
                },
              )}
            >
              {i + 1}. {step}
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSuccess && <Check className="h-4 w-4" />}
            </div>
            {confirmationStatus === "pending" && (
              <span className="whitespace-nowrap text-xs">
                Confirming
                <AnimatedEllipsis />
              </span>
            )}
            {taskStatus && !confirmationStatus && (
              <span className="text-xs">{`└─  ${formatTaskState(taskStatus)}`}</span>
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}
