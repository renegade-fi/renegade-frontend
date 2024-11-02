import React from "react"

import { TaskState, Token } from "@renegade-fi/react"
import { MutationStatus } from "@tanstack/react-query"
import { Check, ExternalLink, Loader2, X } from "lucide-react"
import { extractChain } from "viem"
import { mainnet } from "viem/chains"

import { AnimatedEllipsis } from "@/app/components/animated-ellipsis"

import { Button } from "@/components/ui/button"

import { TASK_STATES } from "@/lib/constants/protocol"
import { formatTaskState } from "@/lib/constants/task"
import { cn } from "@/lib/utils"
import { chain, solana } from "@/lib/viem"

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
    } else if (step.type === "task") {
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
    } else if (step.type === "lifi") {
      return (
        <LiFiStep
          key={i}
          currentStep={currentStep}
          index={i}
          step={step}
          stepCount={execution.steps.length}
          token={execution.token}
        />
      )
    }
    return null
  })
}

export type Execution = {
  steps: (Step | undefined)[]
  token?: Token
}

type StepBase = {
  type: "transaction" | "task" | "lifi"
  label: string
  txHash?: `0x${string}`
  txStatus?: "pending" | "success" | "error"
  chainId?: number
  mutationStatus?: MutationStatus
}

interface TransactionStep extends StepBase {
  type: "transaction"
  txHash?: `0x${string}`
  mutationStatus: MutationStatus
  txStatus?: "pending" | "success" | "error"
}

interface TaskStep extends StepBase {
  type: "task"
  taskStatus?: TaskState
  mutationStatus: MutationStatus
}

interface LiFiStep extends StepBase {
  type: "lifi"
  lifiExplorerLink?: string
}

export type Step = TransactionStep | TaskStep | LiFiStep

type StepProps<T extends Step> = {
  currentStep: number
  index: number
  step: T
  token: Token
  stepCount: number
}

const StepStatus: React.FC<{
  isPending: boolean
  isSuccess: boolean
  isCurrentStep: boolean
  link?: string
  pendingText?: string
  successText?: string
}> = ({
  isPending,
  isSuccess,
  isCurrentStep,
  link,
  pendingText = "Confirming",
  successText = "Confirmed",
}) => {
  const content = (
    <>
      {isPending ? (
        <>
          {pendingText}
          <AnimatedEllipsis />
        </>
      ) : (
        <>
          {successText}
          {link && <ExternalLink className="ml-1 h-3 w-3" />}
        </>
      )}
    </>
  )

  return (
    <span className="whitespace-nowrap transition-colors group-hover:text-primary">
      └─&nbsp;
      {link ? (
        <Button
          asChild
          className={cn("h-4 p-0 text-base group-hover:text-primary", {
            "text-muted": !isCurrentStep,
          })}
          type="button"
          variant="link"
        >
          <a
            href={link}
            rel="noopener noreferrer"
            target="_blank"
          >
            {content}
          </a>
        </Button>
      ) : (
        <span className={cn("text-base", { "text-muted": !isCurrentStep })}>
          {content}
        </span>
      )}
    </span>
  )
}

export function LiFiStep(props: StepProps<LiFiStep>) {
  const { currentStep, index, step } = props
  const isCurrentStep = currentStep === index
  const isPending = step.txStatus === "pending"
  const isSuccess = step.txStatus === "success"
  const isError = step.txStatus === "error"

  const getStatus = () => {
    if (isPending || isSuccess) {
      return (
        <StepStatus
          isCurrentStep={isCurrentStep}
          isPending={isPending}
          isSuccess={isSuccess}
          link={
            isPending
              ? step.lifiExplorerLink
              : step.txHash
                ? getExplorerLink(step.txHash, step.chainId)
                : undefined
          }
        />
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
        {/* Remove isPending check because LiFi status returns Completed almost immediately (for Across) */}
        {isCurrentStep && <Loader2 className="h-4 w-4 animate-spin" />}
        {isSuccess && <Check className="h-4 w-4 text-green-price" />}
        {isError && <X className="h-4 w-4 text-red-price" />}
      </div>
      {getStatus()}
    </div>
  )
}

export function TransactionStep(props: StepProps<TransactionStep>) {
  const { currentStep, index, step } = props
  const isCurrentStep = currentStep === index
  const isPending =
    step.mutationStatus === "pending" ||
    (step.txHash && step.txStatus === "pending")
  const isSuccess =
    step.mutationStatus === "success" ||
    (step.txHash && step.txStatus === "success")
  const isError =
    step.mutationStatus === "error" ||
    (step.txHash && step.txStatus === "error")

  const getStatus = () => {
    if (isPending || isSuccess) {
      return (
        <StepStatus
          isCurrentStep={isCurrentStep}
          isPending={!!isPending}
          isSuccess={!!isSuccess}
          link={
            step.txHash ? getExplorerLink(step.txHash, step.chainId) : undefined
          }
        />
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

export function TaskStep(props: StepProps<TaskStep>) {
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
          >{`${state === "Completed" || state === "Failed" ? "└─" : "├─"} ${formatTaskState(state)}`}</div>
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

export function getExplorerLink(
  txHash: string,
  chainId: number = chain.id,
): string {
  const _chain = extractChain({
    chains: [mainnet, chain, solana],
    id: chainId as 1 | 421614 | 42161 | 1151111081099710,
  })

  const explorerUrl = _chain.blockExplorers?.default.url
  if (!explorerUrl) {
    throw new Error(`No block explorer URL found for chain ${_chain.name}`)
  }
  return `${explorerUrl}/tx/${txHash}`
}
