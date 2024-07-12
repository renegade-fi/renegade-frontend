import * as React from 'react'

import { useCreateOrder } from '@/hooks/use-create-order'
import { useMediaQuery } from '@/hooks/use-media-query'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { Repeat } from 'lucide-react'

import { useStepper } from '@/components/dialogs/new-order-stepper/new-order-stepper'
import { GlowText } from '@/components/glow-text'
import { Button } from '@/components/ui/button'
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DrawerClose,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

export function SuccessStep({
  base,
  side,
  amount,
  clearAmount,
  isUSDCDenominated,
}: {
  base: string
  side: string
  amount: string
  clearAmount: () => void
  isUSDCDenominated?: boolean
}) {
  const { open, setOpen } = useStepper()
  const isDesktop = useMediaQuery('(min-width: 768px)')

  function calculateBaseAmount(amount: string) {
    // TODO: [CORRECTNESS] calculate base price * amount
    return amount
  }

  const normalizedAmount = isUSDCDenominated
    ? calculateBaseAmount(amount)
    : amount

  const handleCreateOrer = useCreateOrder({
    base,
    side,
    amount: normalizedAmount,
    setOpen,
    clearAmount,
  })

  if (isDesktop) {
    return (
      <>
        <DialogHeader className="space-y-4 px-6 pt-6">
          <DialogTitle className="font-extended">Order Placed</DialogTitle>
          <VisuallyHidden>
            <DialogDescription>Order successfully placed.</DialogDescription>
          </VisuallyHidden>
        </DialogHeader>
        <div className="space-y-6 p-6">
          <NewOrderForm
            base={base}
            side={side}
            amount={normalizedAmount}
            className="p-6"
          />
        </div>
        <DialogFooter>
          <Button
            autoFocus
            onClick={() => setOpen(false)}
            variant="outline"
            className="flex-1 border-x-0 border-b-0 border-t font-extended text-2xl"
            size="xl"
          >
            Close
          </Button>
        </DialogFooter>
      </>
    )
  }

  return (
    <>
      <DrawerHeader className="text-left">
        <DrawerTitle className="font-extended">Review Order</DrawerTitle>
      </DrawerHeader>
      <ScrollArea className="max-h-[60vh] overflow-auto">
        <div className="space-y-6 p-4">
          <NewOrderForm
            base={base}
            side={side}
            amount={normalizedAmount}
            className="p-6"
          />
        </div>
      </ScrollArea>
      <DrawerFooter className="pt-2">
        <DrawerClose asChild>
          <Button autoFocus variant="outline">
            Close
          </Button>
        </DrawerClose>
      </DrawerFooter>
    </>
  )
}

function NewOrderForm({
  base,
  side,
  amount,
}: React.ComponentProps<'form'> & {
  base: string
  side: string
  amount: string
}) {
  return (
    <>
      <div className="space-y-4 text-center flex flex-col items-center text-pretty">
        <div>You&apos;re estimated to save</div>
        <GlowText
          className="bg-green-price text-4xl text-center"
          text={'$10.87'}
        />
        <div>when your order fills at the realtime Binance midpoint price.</div>
      </div>
      <Separator />
      <div className=" text-muted-foreground">
        <div className="flex items-center justify-between">
          Did you know?
          <Button size="icon" variant="ghost">
            <Repeat className="h-4 w-4" />
          </Button>
        </div>
        <div>All trades are pre-trade and post-trade private.</div>
      </div>
    </>
  )
}
