import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

import { AssetsSection } from "@/app/trade/[base]/components/new-order/assets-section"
import { NewOrderForm } from "@/app/trade/[base]/components/new-order/new-order-form"

import { NewOrderConfirmationProps } from "@/components/dialogs/order-stepper/desktop/new-order-stepper"
import { Button } from "@/components/ui/button"
import {
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"

export function DefaultStep(props: {
  base: string
  isUSDCDenominated?: boolean
  onSubmit: (values: NewOrderConfirmationProps) => void
}) {
  return (
    <>
      <DialogHeader className="p-0">
        <VisuallyHidden>
          <DialogTitle>Place Order</DialogTitle>
          <DialogDescription>Place a new order.</DialogDescription>
        </VisuallyHidden>
      </DialogHeader>
      <div className="mt-6 p-6">
        <AssetsSection
          disabled
          base={props.base}
        />
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
  )
}
