import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { OrderMetadata } from "@renegade-fi/react"

import { DetailsContent } from "@/app/trade/[base]/components/order-details/details-content"
import { EmptyContent } from "@/app/trade/[base]/components/order-details/empty-content"

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

import { useMediaQuery } from "@/hooks/use-media-query"

export function OrderDetailsSheet({
  children,
  order,
}: {
  children: React.ReactNode
  order: OrderMetadata
}) {
  const isDesktop = useMediaQuery("(min-width: 1024px)")
  if (isDesktop) {
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
  return (
    <Drawer>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent className="max-h-[90dvh]">
        <div className="overflow-auto">
          <VisuallyHidden>
            <DrawerHeader>
              <DrawerTitle>Order Details</DrawerTitle>
              <DrawerDescription>View order details</DrawerDescription>
            </DrawerHeader>
          </VisuallyHidden>
          {order.fills.length ? (
            <DetailsContent order={order} />
          ) : (
            <EmptyContent order={order} />
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
