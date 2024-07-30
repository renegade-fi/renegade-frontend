"use client"

import { useEffect, useRef, useState } from "react"

import { Task, useTaskHistoryWebSocket } from "@renegade-fi/react"
import { toast } from "sonner"

import {
  WITHDRAW_TOAST_ID,
  generateCompletionToastMessage,
  generateFailedToastMessage,
  generateStartToastMessage,
} from "@/lib/constants/task"
import { isPayFeesTask, isSettleMatchTask, isWithdrawTask } from "@/lib/task"

export function TaskToaster() {
  const [incomingTask, setIncomingTask] = useState<Task>()
  useTaskHistoryWebSocket({
    onUpdate(task) {
      setIncomingTask(task)
    },
  })
  const taskIdToStateMap = useRef<Map<string, Task>>(new Map())

  useEffect(() => {
    if (incomingTask) {
      // Ignore duplicate events
      if (
        taskIdToStateMap.current.get(incomingTask.id)?.state ===
        incomingTask.state
      ) {
        return
      }
      taskIdToStateMap.current.set(incomingTask.id, incomingTask)

      // Order toaster handles SettleMatch task completion
      // Ignore pay fees tasks
      if (isSettleMatchTask(incomingTask) || isPayFeesTask(incomingTask)) {
        return
      }

      if (incomingTask.state === "Completed") {
        const message = generateCompletionToastMessage(incomingTask)
        if (isWithdrawTask(incomingTask)) {
          const id = WITHDRAW_TOAST_ID(
            incomingTask.task_info.mint,
            incomingTask.task_info.amount,
          )
          toast.success(message, {
            id,
          })
        } else {
          toast.success(message, {
            id: incomingTask.id,
          })
        }
        return
      } else if (incomingTask.state === "Failed") {
        const message = generateFailedToastMessage(incomingTask)
        toast.error(message, {
          id: incomingTask.id,
        })
      } else if (incomingTask.state === "Proving") {
        if (isWithdrawTask(incomingTask)) {
          return
        }
        const message = generateStartToastMessage(incomingTask)
        toast.loading(message, {
          id: incomingTask.id,
        })
      }
    }
  }, [incomingTask])
  return null
}
