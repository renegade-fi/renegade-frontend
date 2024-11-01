import React from "react"

import { useConnection } from "@solana/wallet-adapter-react"
import { useQuery, QueryStatus } from "@tanstack/react-query"

function useWaitForTransactionReceipt(txid?: string) {
  const { connection } = useConnection()

  const { data: confirmationStatus, status: queryStatus } = useQuery({
    queryKey: ["solana-transaction-receipt", txid],
    queryFn: async () => {
      if (!txid) throw new Error("Transaction ID is required")

      const status = await connection.getSignatureStatus(txid, {
        searchTransactionHistory: true,
      })

      if (status.value?.err) {
        throw new Error(`Transaction failed: ${status.value.err}`)
      }

      return status.value?.confirmationStatus
    },
    enabled: !!txid,
    refetchInterval: (query) => {
      const status = query.state.data
      // Stop polling if confirmed/finalized or if there's an error
      if (status === "confirmed" || status === "finalized") {
        return false
      }
      return 1000 // 1 second polling interval
    },
    retry: false,
  })

  const isSuccess =
    confirmationStatus === "confirmed" || confirmationStatus === "finalized"

  const status: QueryStatus = React.useMemo(() => {
    if (!txid) return "pending"
    if (queryStatus === "error") return "error"
    if (isSuccess) return "success"
    return "pending"
  }, [txid, queryStatus, isSuccess])

  return {
    isSuccess,
    status,
    confirmationStatus,
  }
}

export function useSolanaTransactionConfirmation(
  txid?: string,
  onConfirm?: () => Promise<void>,
) {
  const { isSuccess, status } = useWaitForTransactionReceipt(txid)
  const [isConfirmationHandled, setIsConfirmationHandled] =
    React.useState(false)

  React.useEffect(() => {
    if (isSuccess && txid && !isConfirmationHandled) {
      onConfirm?.()
      setIsConfirmationHandled(true)
    }
  }, [txid, isSuccess, onConfirm, isConfirmationHandled])

  React.useEffect(() => {
    setIsConfirmationHandled(false)
  }, [txid])

  return status
}
