import React from "react"

import {
  getSDKConfig,
  useBackOfQueueWallet,
  useConfig,
} from "@renegade-fi/react"
import { deposit, getPkRootScalars } from "@renegade-fi/react/actions"
import { Token } from "@renegade-fi/token-nextjs"
import { MutationStatus } from "@tanstack/react-query"
import { toast } from "sonner"
import { isAddress } from "viem"
import { useWalletClient } from "wagmi"

import { FAILED_DEPOSIT_MSG } from "@/lib/constants/task"
import { safeParseUnits } from "@/lib/format"
import { signPermit2 } from "@/lib/permit2"

import { useChain } from "./use-chain"

export function useDeposit() {
  const config = useConfig()
  const chainId = useChain()?.id
  const { data: walletClient } = useWalletClient()
  const [status, setStatus] = React.useState<MutationStatus>("idle")
  const { data: keychainNonce } = useBackOfQueueWallet({
    query: {
      select: (wallet) => wallet.key_chain.nonce,
    },
  })

  async function handleDeposit({
    mint,
    amount,

    onSuccess,
  }: {
    mint?: string
    amount: string
    onSuccess?: ({ taskId }: { taskId: string }) => void
  }) {
    if (
      !walletClient ||
      !mint ||
      !isAddress(mint, { strict: false }) ||
      !config ||
      !chainId
    )
      return
    const token = Token.findByAddress(mint as `0x${string}`)
    const parsedAmount = safeParseUnits(amount, token.decimals)
    if (parsedAmount instanceof Error) {
      toast.error("Deposit amount is invalid")
      return
    }
    // TODO: Make into hook
    const pkRoot = getPkRootScalars(config, {
      nonce: keychainNonce ?? BigInt(0),
    })
    setStatus("pending")
    // Generate Permit2 Signature
    const { signature, nonce, deadline } = await signPermit2({
      amount: parsedAmount,
      chainId,
      spender: getSDKConfig(config.state.chainId!).darkpoolAddress,
      permit2Address: getSDKConfig(config.state.chainId!).permit2Address,
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
  return { handleDeposit, status, reset: () => setStatus("idle") }
}
