"use client"

import React from "react"

import { Task, useTaskHistoryWebSocket } from "@renegade-fi/react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import {
  formatTaskState,
  generateCompletionToastMessage,
  generateFailedToastMessage,
  generateStartToastMessage,
} from "@/lib/constants/task"
import {
  isCancelOrderTask,
  isDepositTask,
  isPlaceOrderTask,
  isRefreshWalletTask,
  isWithdrawTask,
} from "@/lib/task"

const DURATION_MS = 15_000 // 15 seconds

export function TaskToaster() {
  const toastTimers = React.useRef<Map<string, NodeJS.Timeout>>(new Map())
  const seenStates = React.useRef<Map<string, string>>(new Map())

  const scheduleToastDismissal = React.useCallback((id: string) => {
    if (toastTimers.current.has(id)) {
      clearTimeout(toastTimers.current.get(id)!)
    }
    const timer = setTimeout(() => {
      toast.dismiss(id)
      toastTimers.current.delete(id)
      seenStates.current.delete(id)
    }, DURATION_MS)
    toastTimers.current.set(id, timer)
  }, [])

  React.useEffect(() => {
    const timers = toastTimers.current
    return () => {
      timers.forEach(clearTimeout)
    }
  }, [])

  useTaskHistoryWebSocket({
    onUpdate(task) {
      const currentState = `${task.id}-${task.state}`
      if (seenStates.current.get(task.id) === currentState) return
      seenStates.current.set(task.id, currentState)

      if (isWithdrawTask(task)) {
        processWithdrawTask(task, scheduleToastDismissal)
      } else if (
        isDepositTask(task) ||
        isPlaceOrderTask(task) ||
        isCancelOrderTask(task) ||
        isRefreshWalletTask(task)
      ) {
        processTask(task, scheduleToastDismissal)
      }
    },
  })

  return null
}

function processTask(
  incomingTask: Task,
  scheduleToastDismissal: (id: string) => void,
) {
  const state = formatTaskState(incomingTask.state)
  const id = incomingTask.id

  if (incomingTask.state === "Completed") {
    const message = generateCompletionToastMessage(incomingTask)
    toast.success(message, { id, description: state, icon: undefined })
  } else if (incomingTask.state === "Failed") {
    const message = generateFailedToastMessage(incomingTask)
    toast.error(message, { id, icon: undefined })
  } else if (incomingTask.state === "Proving") {
    const message = generateStartToastMessage(incomingTask)
    toast.success(message, {
      id,
      description: state,
      icon: <Loader2 className="h-4 w-4 animate-spin text-black" />,
    })
  } else if (
    incomingTask.state === "Updating Validity Proofs" &&
    isDepositTask(incomingTask)
  ) {
    const message = generateCompletionToastMessage(incomingTask)
    toast.success(message, { id, description: "Completed", icon: undefined })
  } else {
    const message = generateStartToastMessage(incomingTask)
    toast.success(message, {
      id,
      description: state,
      icon: <Loader2 className="h-4 w-4 animate-spin text-black" />,
    })
  }

  scheduleToastDismissal(id)
}

function processWithdrawTask(
  incomingTask: Task,
  scheduleToastDismissal: (id: string) => void,
) {
  if (isWithdrawTask(incomingTask)) {
    const state = formatTaskState(incomingTask.state)
    const id = incomingTask.id

    if (incomingTask.state === "Completed") {
      const message = generateCompletionToastMessage(incomingTask)
      toast.success(message, { id, description: state, icon: undefined })
    } else if (incomingTask.state === "Failed") {
      const message = generateFailedToastMessage(incomingTask)
      toast.error(message, { id, icon: undefined })
    } else if (incomingTask.state === "Updating Validity Proofs") {
      const message = generateCompletionToastMessage(incomingTask)
      toast.success(message, { id, description: "Completed", icon: undefined })
    } else if (incomingTask.state === "Proving") {
      return
    } else {
      const message = generateStartToastMessage(incomingTask)
      toast.success(message, {
        id,
        description: state,
        icon: <Loader2 className="h-4 w-4 animate-spin text-black" />,
      })
    }

    scheduleToastDismissal(id)
  }
}
