import { UpdateType } from "@renegade-fi/react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { MaintenanceButtonWrapper } from "@/components/ui/maintenance-button-wrapper";

import { useCancelOrder } from "@/hooks/mutation/use-cancel-order";
import { usePrepareCancelOrder } from "@/hooks/use-prepare-cancel-order";
import { constructStartToastMessage } from "@/lib/constants/task";
import { cn } from "@/lib/utils";

export function CancelButton({
    className,
    id,
    isDisabled,
}: {
    className?: string;
    id: string;
    isDisabled?: boolean;
}) {
    const { data: request } = usePrepareCancelOrder({ id });
    const { mutate: cancelOrder } = useCancelOrder();

    return (
        <MaintenanceButtonWrapper messageKey="cancel" triggerClassName="w-full ">
            <Button
                autoFocus
                className={cn("w-full flex-1", className)}
                disabled={isDisabled}
                onClick={() =>
                    cancelOrder(
                        {
                            id,
                            request,
                        },
                        {
                            onSuccess: (data) => {
                                const message = constructStartToastMessage(UpdateType.CancelOrder);
                                toast.success(message, {
                                    icon: <Loader2 className="h-4 w-4 animate-spin text-black" />,
                                    id: data.taskId,
                                });
                            },
                        },
                    )
                }
                variant="outline"
            >
                Cancel Order
            </Button>
        </MaintenanceButtonWrapper>
    );
}
