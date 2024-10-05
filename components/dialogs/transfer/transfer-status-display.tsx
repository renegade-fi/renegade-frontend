import React from "react"

import { TaskState } from "@renegade-fi/react"
import { MutationStatus } from "@tanstack/react-query"
import { Check, ExternalLink, Loader2 } from "lucide-react"

import { AnimatedEllipsis } from "@/app/components/animated-ellipsis"

import { Button } from "@/components/ui/button"

import { formatTaskState } from "@/lib/constants/task"
import { cn } from "@/lib/utils"
import { viemClient } from "@/lib/viem"

type StepStatus = {
  status: MutationStatus | undefined
  confirmationStatus?: "error" | "pending" | "success"
  taskStatus?: TaskState
  hash?: `0x${string}`
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
        const { status, confirmationStatus, taskStatus, hash } = statuses[i]
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
              {i + 1}.{step}
              {isCurrentStep && isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {isSuccess && <Check className="h-4 w-4" />}
            </div>
            {isCurrentStep && confirmationStatus === "pending" && (
              <span className="whitespace-nowrap text-xs">
                └─&nbsp;Confirming
                <AnimatedEllipsis />
              </span>
            )}
            {hash && confirmationStatus === "success" && (
              <span className="whitespace-nowrap text-xs">
                └─&nbsp;
                <Button
                  className="h-4 p-0"
                  size="sm"
                  type="button"
                  variant="link"
                  onClick={() => {
                    window.open(
                      `${viemClient.chain.blockExplorers?.default.url}/tx/${hash}`,
                      "_blank",
                    )
                  }}
                >
                  Confirmed
                  <ExternalLink className="ml-1 h-3 w-3" />
                </Button>
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
