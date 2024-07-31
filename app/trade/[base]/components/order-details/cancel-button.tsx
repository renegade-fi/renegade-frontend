import { UpdateType, useCancelOrder } from "@renegade-fi/react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"

import { usePrepareCancelOrder } from "@/hooks/usePrepareCancelOrder"
import { constructStartToastMessage } from "@/lib/constants/task"

export function CancelButton({
  id,
  isDisabled,
}: {
  id: string
  isDisabled?: boolean
}) {
  const { request } = usePrepareCancelOrder({ id })
  const { cancelOrder } = useCancelOrder()
  return (
    <Button
      variant="outline"
      className="flex-1"
      disabled={isDisabled}
      onClick={() =>
        cancelOrder(
          {
            id,
            request,
          },
          {
            onSuccess: data => {
              const message = constructStartToastMessage(UpdateType.CancelOrder)
              toast.loading(message, {
                id: data.taskId,
              })
            },
          },
        )
      }
    >
      Cancel Order
    </Button>
  )
}
