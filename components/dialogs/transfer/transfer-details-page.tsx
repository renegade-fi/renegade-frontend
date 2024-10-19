import React from "react"

import { TaskState, Token } from "@renegade-fi/react"
import { MutationStatus } from "@tanstack/react-query"
import { Check, ExternalLink, Loader2, X } from "lucide-react"

import { AnimatedEllipsis } from "@/app/components/animated-ellipsis"

import { Button } from "@/components/ui/button"

import { TASK_STATES } from "@/lib/constants/protocol"
import { formatTaskState } from "@/lib/constants/task"
import { cn } from "@/lib/utils"
import { viemClient } from "@/lib/viem"

export function getSteps(execution: Execution, currentStep: number) {
  return execution.steps.map((step, i) => {
    if (!step || !execution.token) return null
    if (step.type === "transaction") {
      return (
        <TransactionStep
          key={i}
          currentStep={currentStep}
          index={i}
          step={step}
          stepCount={execution.steps.length}
          token={execution.token}
        />
      )
    } else {
      return (
        <TaskStep
          key={i}
          currentStep={currentStep}
          index={i}
          step={step}
          stepCount={execution.steps.length}
          token={execution.token}
        />
      )
    }
  })
}

export type Execution = {
  steps: (Step | undefined)[]
  token?: Token
}

export type Step = {
  type: "transaction" | "task"
  label: string
  txHash?: `0x${string}`
  taskId?: string
  mutationStatus: MutationStatus
  txStatus?: "pending" | "success" | "error"
  taskStatus?: TaskState
}

type StepProps = {
  currentStep: number
  index: number
  step: Step
  token: Token
  stepCount: number
}

export function TransactionStep(props: StepProps) {
  const { currentStep, index, step } = props
  const isCurrentStep = currentStep === index
  const isPending =
    step.mutationStatus === "pending" ||
    (step.txHash && step.txStatus === "pending")
  const isSuccess =
    step.mutationStatus === "success" &&
    step.txHash &&
    step.txStatus === "success"
  const isError =
    step.mutationStatus === "error" ||
    (step.txHash && step.txStatus === "error")

  const getStatus = () => {
    if (isPending) {
      return (
        <span className="whitespace-nowrap transition-colors group-hover:text-primary">
          └─&nbsp;Confirming
          <AnimatedEllipsis />
        </span>
      )
    }
    if (isSuccess) {
      return (
        <span className="whitespace-nowrap transition-colors group-hover:text-primary">
          └─&nbsp;
          <Button
            className={cn("h-4 p-0 text-base group-hover:text-primary", {
              "text-muted": !isCurrentStep,
            })}
            type="button"
            variant="link"
            onClick={() => {
              window.open(
                `${viemClient.chain.blockExplorers?.default.url}/tx/${step.txHash}`,
                "_blank",
              )
            }}
          >
            Confirmed
            <ExternalLink className="ml-1 h-3 w-3" />
          </Button>
        </span>
      )
    }
    return null
  }

  return (
    <div
      className={cn("", {
        "text-muted": !isCurrentStep,
        group: currentStep > index,
      })}
    >
      <div className="flex items-center justify-between transition-colors group-hover:text-primary">
        <span>
          {props.stepCount > 1 ? `${index + 1}. ` : ""}
          {props.step.label}
        </span>
        {isCurrentStep && isPending && (
          <Loader2 className="h-4 w-4 animate-spin" />
        )}
        {isSuccess && <Check className="h-4 w-4 text-green-price" />}
        {isError && <X className="h-4 w-4 text-red-price" />}
      </div>
      {getStatus()}
    </div>
  )
}

export function TaskStep(props: StepProps) {
  const { currentStep, index, step } = props
  const isCurrentStep = currentStep === index
  const isPending =
    step.mutationStatus === "pending" ||
    (step.taskStatus &&
      step.taskStatus !== "Completed" &&
      step.taskStatus !== "Failed")
  const isSuccess = step.taskStatus === "Completed"
  const isError =
    step.taskStatus === "Failed" || step.mutationStatus === "error"

  const getStatus = () => {
    if (currentStep < index) {
      return null
    }
    return (
      <div className="text-muted">
        {TASK_STATES.map((state) => (
          <div
            key={state}
            className={cn("transition-colors hover:text-primary", {
              "text-primary": step.taskStatus === state && isCurrentStep,
            })}
          >{`${state === "Completed" || state === "Failed" ? "└─" : "├─"}  ${formatTaskState(state)}`}</div>
        ))}
      </div>
    )
  }

  return (
    <div
      className={cn("", {
        "text-muted": !isCurrentStep,
        group: currentStep > index,
      })}
    >
      <div className="flex items-center justify-between transition-colors group-hover:text-primary">
        <span>
          {props.stepCount > 1 ? `${index + 1}. ` : ""}
          {props.step.label}
        </span>
        {isCurrentStep && isPending && (
          <Loader2 className="h-4 w-4 animate-spin" />
        )}
        {isSuccess && <Check className="h-4 w-4 text-green-price" />}
        {isError && <X className="h-4 w-4 text-red-price" />}
      </div>
      {getStatus()}
    </div>
  )
}
