import React from "react"

import { useConnection } from "@solana/wallet-adapter-react"
import { useQuery, QueryStatus } from "@tanstack/react-query"

function useWaitForTransactionReceipt(txid?: string) {
  const { connection } = useConnection()

  const { data: isSuccess, status: queryStatus } = useQuery({
    queryKey: ["solana-transaction-receipt", txid],
    queryFn: async () => {
      if (!txid) return false

      const status = await connection.getSignatureStatus(txid, {
        searchTransactionHistory: true,
      })

      if (!status.value) return false

      if (status.value.err) {
        throw new Error(`Transaction failed: ${status.value.err}`)
      }

      return Boolean(
        status.value.confirmationStatus === "confirmed" ||
          status.value.confirmationStatus === "finalized",
      )
    },
    enabled: !!txid,
    refetchInterval: (query) => {
      if (query.state.data || query.state.error) {
        return false
      }
      return 500 // 0.5 second polling interval
    },
    retry: false,
  })

  const status: QueryStatus = React.useMemo(() => {
    if (!txid) return "pending"
    if (queryStatus === "error") return "error"
    if (isSuccess) return "success"
    return "pending"
  }, [txid, queryStatus, isSuccess])

  return {
    isSuccess,
    status,
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
