import React from "react"

import { useTaskHistory } from "@renegade-fi/react"

export function useWaitForTask() {
  const [taskId, setTaskId] = React.useState<string>()
  // const [status, setStatus] = React.useState<TaskState>()
  const { data: status } = useTaskHistory({
    query: {
      select: (data) => (taskId ? data.get(taskId)?.state : undefined),
      enabled: !!taskId,
    },
  })
  return {
    status,
    setTaskId,
    reset: () => {
      setTaskId(undefined)
    },
  }
}
