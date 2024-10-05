import React from "react"

import { TaskState, useTaskHistoryWebSocket } from "@renegade-fi/react"

export function useWaitForTask() {
  // TODO: Refactor useDeposit to useMutation
  const [taskId, setTaskId] = React.useState<string>()
  const [status, setStatus] = React.useState<TaskState>()
  useTaskHistoryWebSocket({
    onUpdate(task) {
      if (task.id === taskId) {
        setStatus(task.state)
      }
    },
  })
  return {
    status,
    setTaskId,
  }
}
