import React from "react"

import {
  Token,
  parseAmount,
  useConfig,
  useTaskHistory,
} from "@renegade-fi/react"
import { deposit, getPkRootScalars } from "@renegade-fi/react/actions"
import { QueryStatus } from "@tanstack/react-query"
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
  amount: number
}) {
  const config = useConfig()
  const { data: walletClient } = useWalletClient()
  const { data: taskHistory } = useTaskHistory()
  const isQueue = Array.from(taskHistory?.values() || []).find(
    (task) => task.state !== "Completed" && task.state !== "Failed",
  )
  const [status, setStatus] = React.useState<QueryStatus>()

  async function handleDeposit({
    onSuccess,
  }: {
    onSuccess?: ({ taskId }: { taskId: string }) => void
  }) {
    if (!walletClient || !mint || !isAddress(mint, { strict: false })) return
    const token = Token.findByAddress(mint as `0x${string}`)
    const amountString =
      typeof amount === "number" ? amount.toFixed(token.decimals) : amount
    const parsedAmount = parseAmount(amountString, token)
    // TODO: Make into hook
    const pkRoot = getPkRootScalars(config)
    setStatus("pending")
    // Generate Permit2 Signature
    const { signature, nonce, deadline } = await signPermit2({
      amount: parsedAmount,
      chainId: chain.id,
      spender: process.env.NEXT_PUBLIC_DARKPOOL_CONTRACT,
      permit2Address: process.env.NEXT_PUBLIC_PERMIT2_CONTRACT,
      token,
      walletClient,
      pkRoot,
    }).catch((e) => {
      toast.error(
        FAILED_DEPOSIT_MSG(
          token,
          parsedAmount,
          e.shortMessage ?? e.response?.data ?? e.message,
        ),
      )
      setStatus("error")
      return e
    })
    if (isQueue) {
      toast.message(QUEUED_DEPOSIT_MSG(token, parsedAmount))
    }
    if (!signature || !nonce || !deadline) {
      setStatus("error")
      return
    }
    await deposit(config, {
      fromAddr: walletClient.account.address,
      mint: token.address,
      amount: parsedAmount,
      permitNonce: nonce,
      permitDeadline: deadline,
      permit: signature,
    })
      .then(({ taskId }) => {
        setStatus("success")
        onSuccess?.({ taskId })
      })
      .catch((e) => {
        console.log("in catch")
        setStatus("error")
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
  return { handleDeposit, status }
}
