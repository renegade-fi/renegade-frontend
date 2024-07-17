import { useEffect } from "react"

import { Token, parseAmount } from "@renegade-fi/react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { isAddress } from "viem"
import { useAccount, useBlockNumber } from "wagmi"

import { useReadErc20Allowance, useWriteErc20Approve } from "@/lib/generated"
import { viemClient } from "@/lib/viem"

const MAX_INT = BigInt(
  "115792089237316195423570985008687907853269984665640564039457584007913129639935",
)

export function useApprove({
  amount,
  mint,
  enabled = true,
}: {
  amount: string
  mint: string
  enabled?: boolean
}) {
  const { address } = useAccount()
  const { data, isSuccess, queryKey } = useReadErc20Allowance({
    address: mint as `0x${string}`,
    args: [address ?? "0x", process.env.NEXT_PUBLIC_PERMIT2_CONTRACT],
    query: {
      enabled:
        enabled &&
        !!mint &&
        isAddress(mint) &&
        !!address &&
        !!process.env.NEXT_PUBLIC_PERMIT2_CONTRACT,
    },
  })

  // Update on new block
  const { data: blockNumber } = useBlockNumber({ watch: true })
  const queryClient = useQueryClient()
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey })
  }, [queryClient, queryKey, blockNumber])

  // Flag is true if and only if allowance successfully fetched and allowance is less than amount
  let needsApproval = false
  if (isSuccess && amount && mint && isAddress(mint)) {
    needsApproval = data < parseAmount(amount, Token.findByAddress(mint))
  }

  // TODO: Handle error case
  const { writeContract } = useWriteErc20Approve({
    mutation: {
      onSuccess(data, variables, context) {
        toast(`Approved ${Token.findByAddress(variables.address).ticker}`, {
          action: {
            label: "Explorer",
            onClick: () => {
              window.open(
                `${viemClient.chain.blockExplorers?.default.url}/tx/${data}`,
                "_blank",
              )
            },
          },
        })
      },
      onError(error) {
        toast.error(`Error approving. Reason: ${error.message}`)
      },
    },
  })

  function handleApprove({ onSuccess }: { onSuccess?: () => void }) {
    if (!mint || !isAddress(mint)) return
    writeContract(
      {
        address: mint,
        args: [process.env.NEXT_PUBLIC_PERMIT2_CONTRACT, MAX_INT],
      },
      {
        onSuccess,
      },
    )
  }

  return { needsApproval, handleApprove }
}
