import React from "react"

import { useWaitForTransactionReceipt } from "wagmi"

export function useTransactionConfirmation(
  hash?: `0x${string}`,
  onConfirm?: () => void,
) {
  const { isSuccess, status } = useWaitForTransactionReceipt({
    hash,
    confirmations: 10,
  })

  const [isConfirmationHandled, setIsConfirmationHandled] =
    React.useState(false)

  React.useEffect(() => {
    if (isSuccess && hash && !isConfirmationHandled) {
      onConfirm?.()
      setIsConfirmationHandled(true)
    }
  }, [hash, isSuccess, onConfirm, isConfirmationHandled])

  return status
}
