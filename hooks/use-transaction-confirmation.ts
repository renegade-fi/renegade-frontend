import React from "react"

import { useWaitForTransactionReceipt } from "wagmi"

export function useTransactionConfirmation(onConfirm?: () => void) {
  const [hash, setHash] = React.useState<`0x${string}` | undefined>(undefined)

  const { isSuccess } = useWaitForTransactionReceipt({
    hash,
    confirmations: 1,
  })

  React.useEffect(() => {
    if (isSuccess && hash) {
      onConfirm?.()
      setHash(undefined)
    }
  }, [hash, isSuccess, onConfirm])

  return {
    setTransactionHash: setHash,
  }
}
