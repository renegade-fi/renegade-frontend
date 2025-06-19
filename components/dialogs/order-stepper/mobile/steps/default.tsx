import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

import { AssetsSection } from "@/app/trade/[base]/components/new-order/assets-section";
import { NewOrderForm } from "@/app/trade/[base]/components/new-order/new-order-form";

import type { NewOrderConfirmationProps } from "@/components/dialogs/order-stepper/desktop/new-order-stepper";
import { Button } from "@/components/ui/button";
import { DialogClose, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

import { useServerStore } from "@/providers/state-provider/server-store-provider";

export function DefaultStep(props: {
    base: `0x${string}`;
    onSubmit: (values: NewOrderConfirmationProps) => void;
}) {
    const quoteMint = useServerStore((state) => state.quoteMint);
    return (
        <>
            <DialogHeader className="p-0">
                <VisuallyHidden>
                    <DialogTitle>Place Order</DialogTitle>
                    <DialogDescription>Place a new order.</DialogDescription>
                </VisuallyHidden>
            </DialogHeader>
            <div className="mt-6 p-6">
                <AssetsSection base={props.base} quote={quoteMint} />
            </div>
            <Separator />
            <div className="h-full overflow-y-auto py-6">
                <NewOrderForm
                    closeButton={
                        <DialogClose asChild>
                            <Button
                                className="flex-1 font-extended text-lg"
                                size="xl"
                                variant="outline"
                            >
                                Close
                            </Button>
                        </DialogClose>
                    }
                    {...props}
                />
            </div>
        </>
    );
}
