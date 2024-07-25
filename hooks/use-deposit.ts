import {
  Token,
  parseAmount,
  useConfig,
  useTaskHistory,
} from "@renegade-fi/react"
import { deposit, getPkRootScalars } from "@renegade-fi/react/actions"
import { toast } from "sonner"
import { isAddress } from "viem"
import { useWalletClient } from "wagmi"

import { FAILED_DEPOSIT_MSG, QUEUED_DEPOSIT_MSG } from "@/lib/constants/task"
import { signPermit2 } from "@/lib/permit2"
import { chain } from "@/lib/viem"

export function useDeposit({
  mint,
  amount,
}: {
  mint?: string
  amount: string
}) {
  const config = useConfig()
  const { data: walletClient } = useWalletClient()
  const { data: taskHistory } = useTaskHistory()
  const isQueue = Array.from(taskHistory?.values() || []).find(
    task => task.state !== "Completed" && task.state !== "Failed",
  )

  async function handleDeposit({ onSuccess }: { onSuccess?: ({ taskId }: { taskId: string }) => void }) {
    if (!walletClient || !mint || !isAddress(mint, { strict: false })) return
    const token = Token.findByAddress(mint as `0x${string}`)
    const parsedAmount = parseAmount(amount, token)
    // TODO: Make into hook
    const pkRoot = getPkRootScalars(config)
    // Generate Permit2 Signature
    const { signature, nonce, deadline } = await signPermit2({
      amount: parsedAmount,
      chainId: chain.id,
      spender: process.env.NEXT_PUBLIC_DARKPOOL_CONTRACT,
      permit2Address: process.env.NEXT_PUBLIC_PERMIT2_CONTRACT,
      token,
      walletClient,
      pkRoot,
    })
    if (isQueue) {
      toast.message(QUEUED_DEPOSIT_MSG(token, parsedAmount))
    }
    await deposit(config, {
      fromAddr: walletClient.account.address,
      mint: token.address,
      amount: parsedAmount,
      permitNonce: nonce,
      permitDeadline: deadline,
      permit: signature,
    })
      .then(onSuccess)
      .catch(e => {
        toast.error(
          FAILED_DEPOSIT_MSG(
            token,
            parsedAmount,
            e.shortMessage ?? e.response?.data ?? e.message,
          ),
        )
        console.error(`Error depositing: ${e.response?.data ?? e.message}`)
      })
  }
  return { handleDeposit }
}
