import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

import { AssetsSection } from "@/app/trade/[base]/components/new-order/assets-section"
import { NewOrderForm } from "@/app/trade/[base]/components/new-order/new-order-form"

import { NewOrderConfirmationProps } from "@/components/dialogs/order-stepper/desktop/new-order-stepper"
import {
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Separator } from "@/components/ui/separator"

export function DefaultStep(props: {
  base: string
  isUSDCDenominated?: boolean
  onSubmit: (values: NewOrderConfirmationProps) => void
}) {
  return (
    <>
      <DrawerHeader className="p-0">
        <VisuallyHidden>
          <DrawerTitle>Place Order</DrawerTitle>
          <DrawerDescription>Place a new order.</DrawerDescription>
        </VisuallyHidden>
      </DrawerHeader>
      <div className="p-6">
        <AssetsSection
          disabled
          base={props.base}
        />
      </div>
      <Separator />
      <div className="pt-6">
        <NewOrderForm {...props} />
      </div>
      <DrawerFooter />
    </>
  )
}
