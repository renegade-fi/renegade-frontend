import React from "react"

import { Token } from "@renegade-fi/react"
import { toast } from "sonner"
import { parseEther } from "viem"
import { BaseError, useWaitForTransactionReceipt } from "wagmi"

import { useWriteWethDeposit } from "@/lib/generated"

export function useWrapEth({
  onSuccess,
  onError,
}: {
  onSuccess: () => void
  onError: (error: Error) => void
}) {
  const weth = Token.findByTicker("WETH")
  const [isConfirmed, setIsConfirmed] = React.useState(false)

  const {
    writeContract,
    data: hash,
    status: writeStatus,
  } = useWriteWethDeposit({
    mutation: {
      onError: (error) => {
        console.error("Error wrapping ETH", error)
        toast.error(
          `Error wrapping ETH: ${(error as BaseError).shortMessage || error.message}`,
        )
        onError?.(error)
      },
    },
  })

  const { status: txStatus } = useWaitForTransactionReceipt({
    hash,
  })

  const wrapEth = React.useCallback(
    (amount: string) => {
      const parsedAmount = parseEther(amount)
      console.log("wrapping", parsedAmount)
      writeContract({
        address: weth?.address,
        value: parsedAmount,
      })
    },
    [weth?.address, writeContract],
  )

  React.useEffect(() => {
    if (txStatus === "success" && !isConfirmed) {
      setIsConfirmed(true)
      onSuccess?.()
    }
  }, [txStatus, isConfirmed, onSuccess])

  const status = hash ? txStatus : writeStatus

  return {
    wrapEth,
    status,
    hash,
    isConfirmed,
  }
}
