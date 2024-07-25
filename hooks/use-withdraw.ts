import {
  Token,
  parseAmount,
  useConfig,
  useFees,
  useTaskHistory,
} from "@renegade-fi/react"
import { payFees, withdraw } from "@renegade-fi/react/actions"
import { toast } from "sonner"
import { isAddress } from "viem"
import { useAccount } from "wagmi"

import {
  FAILED_WITHDRAWAL_MSG,
  QUEUED_WITHDRAWAL_MSG,
} from "@/lib/constants/task"

export function useWithdraw({
  mint,
  amount,
}: {
  mint?: string
  amount: string
}) {
  const { address } = useAccount()
  const config = useConfig()
  const fees = useFees()
  const { data: taskHistory } = useTaskHistory()
  const isQueue = Array.from(taskHistory?.values() || []).find(
    task => task.state !== "Completed" && task.state !== "Failed",
  )

  const handleWithdraw = async ({ onSuccess }: { onSuccess?: ({ taskId }: { taskId: string }) => void }) => {
    if (!address || !mint || !isAddress(mint, { strict: false })) return
    const token = Token.findByAddress(mint as `0x${string}`)
    const parsedAmount = parseAmount(amount, token)
    if (isQueue) {
      toast.message(QUEUED_WITHDRAWAL_MSG(token, parsedAmount))
    }

    if (fees.size > 0) {
      await payFees(config)
    }

    // Withdraw
    await withdraw(config, {
      mint: token.address,
      amount: parsedAmount,
      destinationAddr: address,
    })
      .then(onSuccess)
      .catch(e => {
        toast.error(FAILED_WITHDRAWAL_MSG(token, parsedAmount))
        console.error(`Error withdrawing: ${e.response?.data ?? e.message}`)
      })
  }

  return { handleWithdraw }
}
