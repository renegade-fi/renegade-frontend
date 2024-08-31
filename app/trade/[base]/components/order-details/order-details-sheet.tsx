import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { OrderMetadata } from "@renegade-fi/react"

import { DetailsContent } from "@/app/trade/[base]/components/order-details/details.content"
import { EmptyContent } from "@/app/trade/[base]/components/order-details/empty-content"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

export function OrderDetailsSheet({
  children,
  order,
}: {
  children: React.ReactNode
  order: OrderMetadata
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent
        hideCloseButton
        className="p-0 sm:w-[576px] sm:max-w-[576px]"
        onOpenAutoFocus={(e) => {
          e.preventDefault()
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
  )
}
