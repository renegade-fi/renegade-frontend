import { UpdateType, useCancelOrder } from "@renegade-fi/react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  ResponsiveTooltip,
  ResponsiveTooltipContent,
  ResponsiveTooltipTrigger,
} from "@/components/ui/responsive-tooltip"

import { useMaintenanceMode } from "@/hooks/use-maintenance-mode"
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
  const { data: maintenanceMode } = useMaintenanceMode()
  return (
    <ResponsiveTooltip>
      <ResponsiveTooltipTrigger className="!pointer-events-auto w-full">
        <Button
          autoFocus
          className="w-full flex-1"
          disabled={
            isDisabled ||
            (maintenanceMode?.enabled &&
              maintenanceMode.severity === "critical")
          }
          variant="outline"
          onClick={() =>
            cancelOrder(
              {
                id,
                request,
              },
              {
                onSuccess: (data) => {
                  const message = constructStartToastMessage(
                    UpdateType.CancelOrder,
                  )
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
      </ResponsiveTooltipTrigger>
      <ResponsiveTooltipContent
        className={
          maintenanceMode?.enabled && maintenanceMode.severity === "critical"
            ? "visible"
            : "invisible"
        }
      >
        {`Cancelling orders is temporarily disabled${maintenanceMode?.reason ? ` ${maintenanceMode.reason}` : ""}.`}
      </ResponsiveTooltipContent>
    </ResponsiveTooltip>
  )
}
