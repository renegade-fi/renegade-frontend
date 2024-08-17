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
  isDepositTask,
  isPayFeesTask,
  isSettleMatchTask,
  isWithdrawTask,
} from "@/lib/task"

export function TaskToaster() {
  const [incomingTask, setIncomingTask] = React.useState<Task>()
  const taskIdToStateMap = React.useRef<Map<string, Task>>(new Map())
  useTaskHistoryWebSocket({
    onUpdate(task) {
      if (taskIdToStateMap.current.get(task.id)?.state === task.state) {
        return
      }
      taskIdToStateMap.current.set(task.id, task)
      setIncomingTask(task)
    },
  })

  React.useEffect(() => {
    if (incomingTask) {
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
      console.log("state in effect 1", state)

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
  }, [incomingTask])

  React.useEffect(() => {
    if (incomingTask && isWithdrawTask(incomingTask)) {
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
  }, [incomingTask])
  return null
}
