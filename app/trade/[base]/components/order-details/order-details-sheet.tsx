import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import type { OrderMetadata } from "@renegade-fi/react";

import { DetailsContent } from "@/app/trade/[base]/components/order-details/details-content";
import { EmptyContent } from "@/app/trade/[base]/components/order-details/empty-content";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";

import { useMediaQuery } from "@/hooks/use-media-query";

export function OrderDetailsSheet({
    children,
    order,
}: {
    children: React.ReactNode;
    order: OrderMetadata;
}) {
    const isDesktop = useMediaQuery("(min-width: 1024px)");
    if (isDesktop) {
        return (
            <Sheet>
                <SheetTrigger asChild>{children}</SheetTrigger>
                <SheetContent
                    className="p-0 sm:w-[576px] sm:max-w-[576px]"
                    hideCloseButton
                    onOpenAutoFocus={(e) => {
                        e.preventDefault();
                    }}
                >
                    <SheetHeader>
                        <VisuallyHidden>
                            <SheetTitle>Order Details</SheetTitle>
                            <SheetDescription>View order details</SheetDescription>
                        </VisuallyHidden>
                    </SheetHeader>
                    {order.fills.length ? (
                        <DetailsContent order={order} />
                    ) : (
                        <EmptyContent order={order} />
                    )}
                </SheetContent>
            </Sheet>
        );
    }
    return (
        <Dialog>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="h-dvh gap-0 p-0">
                <VisuallyHidden>
                    <DialogHeader>
                        <DialogTitle>Order Details</DialogTitle>
                        <DialogDescription>View order details</DialogDescription>
                    </DialogHeader>
                </VisuallyHidden>
                <div className="overflow-y-auto">
                    {order.fills.length ? (
                        <DetailsContent order={order} />
                    ) : (
                        <EmptyContent order={order} />
                    )}
                </div>
                <DialogFooter className="p-6 pt-0">
                    <DialogClose asChild>
                        <Button className="font-extended text-lg" size="xl" variant="outline">
                            Close
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
