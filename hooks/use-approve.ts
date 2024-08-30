import React from "react"

import { Token } from "@renegade-fi/react"
import { QueryStatus, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { isAddress } from "viem"
import { BaseError, useAccount, useWaitForTransactionReceipt } from "wagmi"

import { useRefreshOnBlock } from "@/hooks/use-refresh-on-block"
import { safeParseUnits } from "@/lib/format"
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
  const queryClient = useQueryClient()
  const {
    data: allowance,
    isSuccess,
    queryKey,
  } = useReadErc20Allowance({
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
  const [status, setStatus] = React.useState<QueryStatus>()

  const needsApproval = React.useMemo(() => {
    if (!mint || !isAddress(mint) || !address || !isSuccess) return false
    const token = Token.findByAddress(mint as `0x${string}`)
    const parsedAmount = safeParseUnits(amount, token.decimals)
    if (parsedAmount instanceof Error) return false
    return parsedAmount > allowance
  }, [mint, address, allowance, isSuccess, amount])

  const { writeContract, data: hash } = useWriteErc20Approve()

  async function handleApprove({ onSuccess }: { onSuccess?: () => void }) {
    if (!mint || !isAddress(mint) || !address) return
    setStatus("pending")
    const nonce = await viemClient.getTransactionCount({
      address,
    })
    writeContract(
      {
        address: mint,
        args: [process.env.NEXT_PUBLIC_PERMIT2_CONTRACT, MAX_INT],
        nonce,
      },
      {
        onSuccess(data, variables) {
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

          setStatus("success")
          onSuccess?.()
        },
        onError(error) {
          setStatus("error")
          toast.error(
            `Error approving: ${(error as BaseError).shortMessage || error.message}`,
          )
        },
      },
    )
  }

  const { isSuccess: isApproved } = useWaitForTransactionReceipt({
    hash,
  })
  React.useEffect(() => {
    if (isApproved) {
      queryClient.invalidateQueries({ queryKey })
    }
  }, [isApproved, queryClient, queryKey])
  useRefreshOnBlock({ queryKey })

  return { needsApproval, handleApprove, status }
}
