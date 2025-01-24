import React from "react"

import { ExtendedTransactionInfo, StatusMessage, getStatus } from "@lifi/sdk"
import { useQuery } from "@tanstack/react-query"

export function useSwapConfirmation(
  hash?: `0x${string}`,
  onConfirm?: (data: {
    status: "error" | "pending" | "success"
    receivedAmount: string
  }) => void,
) {
  const { data, status } = useQuery({
    queryKey: ["swap", "status", hash],
    queryFn: () => getStatus({ txHash: hash ?? "" }),
    enabled: !!hash,
    select: (data) => {
      let status: "error" | "pending" | "success" = "pending"
      switch (data.status) {
        case "INVALID":
        case "FAILED":
        case "NOT_FOUND":
          status = "error"
          break
        case "DONE":
          status = "success"
          break
      }
      return {
        status,
        receivedAmount:
          "receiving" in data
            ? ((data.receiving as ExtendedTransactionInfo).amount ?? "0")
            : "0",
      }
    },
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return status && ["INVALID", "DONE", "FAILED"].includes(status)
        ? false
        : 1000
    },
  })

  const [isConfirmationHandled, setIsConfirmationHandled] =
    React.useState(false)

  // TODO: useTransactionConfirmation
  React.useEffect(() => {
    if (data && data.status === "success" && hash && !isConfirmationHandled) {
      onConfirm?.(data)
      setIsConfirmationHandled(true)
    }
  }, [hash, onConfirm, isConfirmationHandled, data])

  // If hash changes, should run onConfirm
  React.useEffect(() => {
    setIsConfirmationHandled(false)
  }, [hash])

  // TODO: Improve this
  return hash && status === "pending"
    ? ({ status: "pending", receivedAmount: "0" } as const)
    : data
}
