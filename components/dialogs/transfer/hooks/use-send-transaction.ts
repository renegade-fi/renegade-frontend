import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { VersionedTransaction } from "@solana/web3.js"
import { useMutation } from "@tanstack/react-query"
import { stringToBytes } from "viem"

export function useSendTransaction() {
  const { connection } = useConnection()
  const { signTransaction } = useWallet()
  return {
    ...useMutation({
      mutationFn: async (transactionRequest: string) => {
        if (!signTransaction) {
          throw new Error("signTransaction is not available")
        }
        const decodedTx = atob(transactionRequest)
        const decodedTxBytes = stringToBytes(decodedTx)
        const deserializedTx = VersionedTransaction.deserialize(decodedTxBytes)
        const signedTx = await signTransaction(deserializedTx)
        return connection.sendTransaction(signedTx)
      },
    }),
  }
}
