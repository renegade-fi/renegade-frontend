import React from "react"

import { useTaskHistory } from "@renegade-fi/react"

export function useWaitForTask() {
  // TODO: Refactor useDeposit to useMutation and declaratively pass taskId from { data }
  // TODO: Then, remove manual reset
  const [taskId, setTaskId] = React.useState<string>()
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
