import {
  Token,
  UpdateType,
  parseAmount,
  useConfig,
  usePayFees,
  useTaskHistory,
} from "@renegade-fi/react"
import { withdraw } from "@renegade-fi/react/actions"
import { toast } from "sonner"
import { isAddress } from "viem"
import { useAccount } from "wagmi"

import {
  FAILED_WITHDRAWAL_MSG,
  QUEUED_WITHDRAWAL_MSG,
  WITHDRAW_TOAST_ID,
  constructStartToastMessage,
} from "@/lib/constants/task"

export function useWithdraw({
  mint,
  amount,
}: {
  mint?: string
  amount: number
}) {
  const { address } = useAccount()
  const config = useConfig()
  const { data: isQueue } = useTaskHistory({
    query: {
      select: (data) =>
        Array.from(data.values()).some(
          (task) => task.state !== "Completed" && task.state !== "Failed",
        ),
    },
  })
  const { payFeesAsync } = usePayFees()

  const handleWithdraw = async ({
    onSuccess,
  }: {
    onSuccess?: ({ taskId }: { taskId: string }) => void
  }) => {
    if (!address || !mint || !isAddress(mint, { strict: false })) return
    const token = Token.findByAddress(mint as `0x${string}`)
    const amountString =
      typeof amount === "number" ? amount.toFixed(token.decimals) : amount
    const parsedAmount = parseAmount(amountString, token)

    const message = isQueue
      ? QUEUED_WITHDRAWAL_MSG(token, parsedAmount)
      : constructStartToastMessage(UpdateType.Withdraw)
    const id = WITHDRAW_TOAST_ID(mint, parsedAmount)

    toast.loading(message, {
      id,
    })

    await payFeesAsync()

    // Withdraw
    await withdraw(config, {
      mint: token.address,
      amount: parsedAmount,
      destinationAddr: address,
    })
      .then(onSuccess)
      .catch((e) => {
        toast.error(FAILED_WITHDRAWAL_MSG(token, parsedAmount), {
          id,
        })
        console.error(`Error withdrawing: ${e.response?.data ?? e.message}`)
      })
  }

  return { handleWithdraw }
}
