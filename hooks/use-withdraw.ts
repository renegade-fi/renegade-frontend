import { useState } from "react"

import { ConfigRequiredError } from "@renegade-fi/react"
import { withdraw } from "@renegade-fi/react/actions"
import { MutationStatus } from "@tanstack/react-query"
import { toast } from "sonner"
import { isAddress } from "viem"
import { useAccount } from "wagmi"

import { FAILED_WITHDRAWAL_MSG } from "@/lib/constants/task"
import { safeParseUnits } from "@/lib/format"
import { resolveAddress } from "@/lib/token"
import { useConfig } from "@/providers/renegade-provider/config-provider"

import { usePayFees } from "./mutation/use-pay-fees"

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
  const { mutateAsync: payFees } = usePayFees()

  const handleWithdraw = async ({
    onSuccess,
  }: {
    onSuccess?: ({ taskId }: { taskId: string }) => void
  }) => {
    if (!config) throw new ConfigRequiredError("useWithdraw")
    if (!address || !mint || !isAddress(mint, { strict: false })) return
    const token = resolveAddress(mint as `0x${string}`)
    const parsedAmount = safeParseUnits(amount, token.decimals)
    if (parsedAmount instanceof Error) {
      toast.error("Withdrawal amount is invalid")
      return
    }
    setStatus("pending")

    await payFees()

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
