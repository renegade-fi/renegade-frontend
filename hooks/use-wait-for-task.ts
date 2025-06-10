import React from "react"

import { useTaskHistory } from "@/hooks/query/use-task-history"

export function useWaitForTask(onConfirm?: () => void) {
  // TODO: Refactor useDeposit to useMutation and declaratively pass taskId from { data }
  // TODO: Then, remove manual reset
  const [taskId, setTaskId] = React.useState<string>()
  const { data: status } = useTaskHistory({
    query: {
      select: (data) => (taskId ? data.get(taskId)?.state : undefined),
      enabled: !!taskId,
    },
  })

  const [isConfirmationHandled, setIsConfirmationHandled] =
    React.useState(false)

  React.useEffect(() => {
    if (status === "Completed" && !isConfirmationHandled) {
      onConfirm?.()
      setIsConfirmationHandled(true)
    }
  }, [status, onConfirm, isConfirmationHandled])

  React.useEffect(() => {
    setIsConfirmationHandled(false)
  }, [taskId])

  return {
    status,
    setTaskId,
    reset: () => {
      setTaskId(undefined)
    },
  }
}
