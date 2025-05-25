import { useState } from "react"

import { useConfig, usePayFees } from "@renegade-fi/react"
import { withdraw } from "@renegade-fi/react/actions"
import { Token } from "@renegade-fi/token-nextjs"
import { MutationStatus } from "@tanstack/react-query"
import { toast } from "sonner"
import { isAddress } from "viem"
import { useAccount } from "wagmi"

import { FAILED_WITHDRAWAL_MSG } from "@/lib/constants/task"
import { safeParseUnits } from "@/lib/format"

export function useWithdraw({
  mint,
  amount,
}: {
  mint?: string
  amount: string
}) {
  const { address } = useAccount()
  const config = useConfig()
  const [status, setStatus] = useState<MutationStatus>("idle")
  const { payFeesAsync } = usePayFees()

  const handleWithdraw = async ({
    onSuccess,
  }: {
    onSuccess?: ({ taskId }: { taskId: string }) => void
  }) => {
    if (!address || !mint || !isAddress(mint, { strict: false })) return
    const token = Token.findByAddress(mint as `0x${string}`)
    const parsedAmount = safeParseUnits(amount, token.decimals)
    if (parsedAmount instanceof Error) {
      toast.error("Withdrawal amount is invalid")
      return
    }
    setStatus("pending")

    await payFeesAsync()

    // Withdraw
    await withdraw(config, {
      mint: token.address,
      amount: parsedAmount,
      destinationAddr: address,
    })
      .then(({ taskId }) => {
        setStatus("success")
        onSuccess?.({ taskId })
      })
      .catch((e) => {
        toast.error(FAILED_WITHDRAWAL_MSG(token, parsedAmount))
        setStatus("error")
        console.error(`Error withdrawing: ${e.response?.data ?? e.message}`)
      })
  }

  return { handleWithdraw, status, reset: () => setStatus("idle") }
}
