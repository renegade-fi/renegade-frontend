"use client"

import React from "react"

import { Task, useTaskHistoryWebSocket } from "@renegade-fi/react"
import { toast } from "sonner"

import {
  WITHDRAW_TOAST_ID,
  formatTaskState,
  generateCompletionToastMessage,
  generateFailedToastMessage,
  generateStartToastMessage,
} from "@/lib/constants/task"
import {
  isCancelOrderTask,
  isDepositTask,
  isPayFeesTask,
  isSettleMatchTask,
  isWithdrawTask,
} from "@/lib/task"

export function TaskToaster() {
  const seen = React.useRef<Map<string, Task>>(new Map())
  useTaskHistoryWebSocket({
    onUpdate(task) {
      if (seen.current.get(task.id)?.state === task.state) {
        return
      }
      seen.current.set(task.id, task)
      if (isWithdrawTask(task)) {
        processWithdrawTask(task)
      } else {
        processTask(task)
      }
    },
  })

  return null
}

function processTask(incomingTask: Task) {
  // Order toaster handles SettleMatch task completion
  // Ignore pay fees tasks
  // Handle withdraw tasks separately
  if (
    isSettleMatchTask(incomingTask) ||
    isPayFeesTask(incomingTask) ||
    isWithdrawTask(incomingTask)
  ) {
    return
  }

  const state = formatTaskState(incomingTask.state)
  if (isCancelOrderTask(incomingTask)) {
    console.log("debug incoming task", {
      id: incomingTask.id,
      n: incomingTask.task_info.amount,
      state,
    })
  }

  if (incomingTask.state === "Completed") {
    const message = generateCompletionToastMessage(incomingTask)
    toast.success(message, {
      id: incomingTask.id,
      description: state,
    })
    return
  } else if (incomingTask.state === "Failed") {
    const message = generateFailedToastMessage(incomingTask)
    toast.error(message, {
      id: incomingTask.id,
    })
  } else if (incomingTask.state === "Proving") {
    const message = generateStartToastMessage(incomingTask)
    toast.loading(message, {
      id: incomingTask.id,
      description: state,
    })
  } else if (
    incomingTask.state === "Updating Validity Proofs" &&
    isDepositTask(incomingTask)
  ) {
    const message = generateCompletionToastMessage(incomingTask)
    toast.success(message, {
      id: incomingTask.id,
      description: "Completed",
    })
  } else {
    const message = generateStartToastMessage(incomingTask)
    toast.loading(message, {
      id: incomingTask.id,
      description: state,
    })
  }
}

function processWithdrawTask(incomingTask: Task) {
  if (isWithdrawTask(incomingTask)) {
    const state = formatTaskState(incomingTask.state)
    const id = WITHDRAW_TOAST_ID(
      incomingTask.task_info.mint,
      incomingTask.task_info.amount,
    )
    if (incomingTask.state === "Completed") {
      const message = generateCompletionToastMessage(incomingTask)
      toast.success(message, {
        id,
        description: state,
      })
      return
    } else if (incomingTask.state === "Failed") {
      const message = generateFailedToastMessage(incomingTask)
      toast.error(message, {
        id,
      })
    } else if (incomingTask.state === "Updating Validity Proofs") {
      const message = generateCompletionToastMessage(incomingTask)
      toast.success(message, {
        id,
        description: "Completed",
      })
    } else if (incomingTask.state === "Proving") {
      return
    } else {
      const message = generateStartToastMessage(incomingTask)
      toast.loading(message, {
        id,
        description: state,
      })
    }
  }
}
