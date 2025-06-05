import React from "react"

import { useTaskHistory } from "@renegade-fi/react"

import { useServerStore } from "@/providers/state-provider/server-store-provider"

export function useWaitForTask(onConfirm?: () => void) {
  // TODO: Refactor useDeposit to useMutation and declaratively pass taskId from { data }
  // TODO: Then, remove manual reset
  const [taskId, setTaskId] = React.useState<string>()
  const wallet = useServerStore((state) => state.wallet)
  const { data: status } = useTaskHistory({
    seed: wallet.seed,
    walletId: wallet.id,
    chainId: wallet.chainId,
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
