import React from "react"

import { useConnection } from "@solana/wallet-adapter-react"
import { BlockheightBasedTransactionConfirmationStrategy } from "@solana/web3.js"
import { useQuery } from "@tanstack/react-query"

export function useSolanaTransactionConfirmation(
  txid?: string,
  onConfirm?: (confirmation: { signature: string }) => Promise<void>,
) {
  const { connection } = useConnection()
  const [isConfirmationHandled, setIsConfirmationHandled] =
    React.useState(false)

  const { data, status } = useQuery({
    queryKey: ["solana-transaction-confirmation", txid],
    queryFn: async () => {
      if (!txid) throw new Error("Transaction ID is required")

      const confirmation = await connection.confirmTransaction(
        {
          signature: txid,
        } as BlockheightBasedTransactionConfirmationStrategy,
        "confirmed",
      )
      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${confirmation.value.err}`)
      }

      return confirmation
    },
    enabled: !!txid,
    refetchInterval: (query) => {
      // Stop polling once confirmed or if there's an error
      if (query.state.data?.value.err) {
        return false
      } else if (query.state.data?.context.slot) {
        return false
      }
      return 1000 // 1 second polling interval
    },
    retry: false,
  })

  React.useEffect(() => {
    if (data?.context.slot && txid && !isConfirmationHandled) {
      onConfirm?.({ signature: txid })
      setIsConfirmationHandled(true)
    }
  }, [data, txid, isConfirmationHandled, onConfirm])

  React.useEffect(() => {
    setIsConfirmationHandled(false)
  }, [txid])

  return status
}
