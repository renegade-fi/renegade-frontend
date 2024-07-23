import { NewOrderConfirmationProps } from "@/components/dialogs/new-order-stepper/new-order-stepper"

import { useOrderValue } from "@/hooks/use-order-value"

const savingsThreshold = 0.05

export function useFeesCheck({
  params,
}: {
  params: NewOrderConfirmationProps
}) {
  let shouldDisplaySavings = false
  const orderValue = useOrderValue({ ...params })

  const threshold = orderValue * savingsThreshold

  if (params.predictedSavings > threshold) {
    shouldDisplaySavings = true
  }

  return { shouldDisplaySavings }
}
