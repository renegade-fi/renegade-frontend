import { Token, useConfig, usePayFees } from "@renegade-fi/react"
import { withdraw } from "@renegade-fi/react/actions"
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

    await payFeesAsync()

    // Withdraw
    await withdraw(config, {
      mint: token.address,
      amount: parsedAmount,
      destinationAddr: address,
    })
      .then(onSuccess)
      .catch((e) => {
        toast.error(FAILED_WITHDRAWAL_MSG(token, parsedAmount))
        console.error(`Error withdrawing: ${e.response?.data ?? e.message}`)
      })
  }

  return { handleWithdraw }
}
