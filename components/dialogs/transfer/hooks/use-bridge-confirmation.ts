import React from "react"

import {
  ExtendedTransactionInfo,
  StatusMessage,
  StatusResponse,
  getStatus,
} from "@lifi/sdk"
import { useQuery } from "@tanstack/react-query"

// Type guard to check if the status response has a 'receiving' property of type ExtendedTransactionInfo
function hasReceiving(
  data: StatusResponse,
): data is StatusResponse & { receiving: ExtendedTransactionInfo } {
  return (
    "receiving" in data &&
    typeof data.receiving === "object" &&
    data.receiving !== null
  )
}

// Type guard to check if the status response has a 'lifiExplorerLink' property
function hasLifiExplorerLink(
  data: StatusResponse,
): data is StatusResponse & { bridgeExplorerLink: string } {
  return "bridgeExplorerLink" in data
}

const defaultValues = {
  status: "NOT_FOUND" as StatusMessage,
  sendHash: "",
  lifiExplorerLink: "",
  receivedAmount: "0",
  receiveHash: "",
}

export function useBridgeConfirmation(
  hash?: string,
  onConfirm?: (data: typeof defaultValues) => Promise<void>,
) {
  const { data, status } = useQuery({
    queryKey: ["bridge", "status", hash],
    queryFn: () => getStatus({ txHash: hash ?? "" }),
    enabled: !!hash,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return status && ["INVALID", "DONE", "FAILED"].includes(status)
        ? false
        : 1000
    },
  })

  // TODO: Test this
  // Previous issue was this step was transitioning to pending too soon
  const processedData = React.useMemo(() => {
    if (!data) return defaultValues

    return {
      status: data.status,
      sendHash: data.sending?.txHash ?? "",
      lifiExplorerLink: hasLifiExplorerLink(data)
        ? data.bridgeExplorerLink
        : "",
      receivedAmount: hasReceiving(data) ? (data.receiving.amount ?? "0") : "0",
      receiveHash: hasReceiving(data) ? (data.receiving.txHash ?? "") : "",
    }
  }, [data])

  const [isConfirmationHandled, setIsConfirmationHandled] =
    React.useState(false)

  React.useEffect(() => {
    if (
      processedData &&
      processedData.status === "DONE" &&
      hash &&
      !isConfirmationHandled
    ) {
      onConfirm?.(processedData)
      setIsConfirmationHandled(true)
    }
  }, [hash, isConfirmationHandled, onConfirm, processedData])

  React.useEffect(() => {
    setIsConfirmationHandled(false)
  }, [hash])

  return {
    data: processedData ?? defaultValues,
  }
}
