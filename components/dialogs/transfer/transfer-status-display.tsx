import React from "react"

import { TaskState } from "@renegade-fi/react"
import { MutationStatus } from "@tanstack/react-query"
import { Check, ExternalLink, Loader2, X } from "lucide-react"

import { AnimatedEllipsis } from "@/app/components/animated-ellipsis"

import { Button } from "@/components/ui/button"

import { TASK_STATES } from "@/lib/constants/protocol"
import { formatTaskState } from "@/lib/constants/task"
import { cn } from "@/lib/utils"
import { viemClient } from "@/lib/viem"

type StepStatus = {
  status: MutationStatus | undefined
  confirmationStatus?: "error" | "pending" | "success"
  taskStatus?: TaskState
  hash?: `0x${string}`
  isTask?: boolean
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
        const { status, confirmationStatus, taskStatus, hash, isTask } =
          statuses[i]
        const isCurrentStep = currentStep === i
        const isPending =
          status === "pending" ||
          (hash && confirmationStatus === "pending") ||
          (taskStatus && taskStatus !== "Completed" && taskStatus !== "Failed")
        const isSuccess =
          (status === "success" && confirmationStatus === "success") ||
          taskStatus === "Completed"
        const isError =
          status === "error" ||
          (hash && confirmationStatus === "error") ||
          (taskStatus && taskStatus === "Failed")

        const Content = () => {
          if (isTask) {
            return (
              <div className="text-xs text-muted">
                {TASK_STATES.map((state) => (
                  <div
                    key={state}
                    className={cn("hover:text-primary", {
                      "text-primary": taskStatus === state && isCurrentStep,
                    })}
                  >{`└─  ${formatTaskState(state)}`}</div>
                ))}
              </div>
            )
          }

          if (confirmationStatus) {
            if (hash) {
              if (isCurrentStep) {
                ;<span className="whitespace-nowrap text-xs transition-colors group-hover:text-primary">
                  └─&nbsp;Confirming
                  <AnimatedEllipsis />
                </span>
              } else if (confirmationStatus === "success")
                <span className="whitespace-nowrap text-xs transition-colors group-hover:text-primary">
                  └─&nbsp;
                  <Button
                    className={cn("h-4 p-0 group-hover:text-primary", {
                      "text-muted": !isCurrentStep,
                    })}
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
            }
          }
        }

        return (
          <div
            key={step}
            className={cn("", {
              "text-muted": !isCurrentStep,
              group: currentStep > i,
            })}
          >
            <div className="flex items-center justify-between transition-colors group-hover:text-primary">
              {i + 1}.&nbsp;{step}
              {isCurrentStep && isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {isSuccess && <Check className="h-4 w-4 text-green-price" />}
              {isError && <X className="h-4 w-4 text-red-price" />}
            </div>
            <Content />
          </div>
        )
      })}
    </div>
  )
}
