import { TransactionRequest } from "@lifi/sdk"
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { VersionedTransaction } from "@solana/web3.js"
import { useMutation } from "@tanstack/react-query"

export function useSendSolanaTransaction() {
  const { connection } = useConnection()
  const { signTransaction } = useWallet()
  return {
    ...useMutation({
      mutationFn: async (transactionRequest?: TransactionRequest) => {
        if (!transactionRequest) {
          throw new Error("Transaction request is not available")
        }
        if (!signTransaction) {
          throw new Error("signTransaction is not available")
        }

        // Convert transaction request data to bytes
        const serializedTx = Buffer.from(
          transactionRequest.data as string,
          "base64",
        )

        // Create a versioned transaction from the serialized data
        const tx = VersionedTransaction.deserialize(serializedTx)

        // Sign the transaction
        const signedTx = await signTransaction(tx)

        // Send the signed transaction
        const signature = await connection.sendRawTransaction(
          signedTx.serialize(),
        )
        console.log("Sent transaction", signature)

        // Wait for transaction confirmation
        // const confirmation = await connection.confirmTransaction(signature)

        // if (confirmation.value.err) {
        //   throw new Error(`Transaction failed: ${confirmation.value.err}`)
        // }

        return signature
      },
    }),
  }
}
