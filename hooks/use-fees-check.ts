import { NewOrderConfirmationProps } from "@/components/dialogs/order-stepper/desktop/new-order-stepper"

import { useOrderValue } from "@/hooks/use-order-value"

const savingsThreshold = 0.05

export function useFeesCheck({
  params,
}: {
  params: NewOrderConfirmationProps
}) {
  let shouldDisplaySavings = false
  const { priceInUsd } = useOrderValue({ ...params })

  const threshold = parseFloat(priceInUsd) * savingsThreshold

  if (params.predictedSavings > threshold) {
    shouldDisplaySavings = true
  }

  return { shouldDisplaySavings }
}
