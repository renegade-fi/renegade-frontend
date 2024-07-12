import * as React from 'react'

import { useCreateOrder } from '@/hooks/use-create-order'
import { useMediaQuery } from '@/hooks/use-media-query'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'

import { FeesSection } from '@/app/trade/[base]/components/new-order/fees-sections'

import { useStepper } from '@/components/dialogs/new-order-stepper/new-order-stepper'
import { TokenIcon } from '@/components/token-icon'
import { Button } from '@/components/ui/button'
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

export function DefaultStep({
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
  const { onNext } = useStepper()
  const [open, setOpen] = React.useState(false)
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
          <DialogTitle className="font-extended">Review Order</DialogTitle>
          <VisuallyHidden>
            <DialogDescription>
              Review your order before placing it.
            </DialogDescription>
          </VisuallyHidden>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh]">
          <div className="space-y-6 p-6">
            <NewOrderForm base={base} side={side} amount={normalizedAmount} />
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button
            onClick={onNext}
            variant="outline"
            className="flex-1 border-x-0 border-b-0 border-t font-extended text-2xl"
            size="xl"
          >
            {side === 'buy' ? 'Buy' : 'Sell'} {base}
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
          <NewOrderForm base={base} side={side} amount={normalizedAmount} />
        </div>
      </ScrollArea>
      <DrawerFooter className="pt-2">
        <Button variant="outline" onClick={onNext}>
          {side === 'buy' ? 'Buy' : 'Sell'} {base}
        </Button>
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
      <div className="space-y-3">
        <div className="text-muted-foreground">
          {side === 'buy' ? 'Buy' : 'Sell'}
        </div>
        <div className="flex items-center justify-between">
          <div className="font-serif text-3xl font-bold">
            {amount} {base}
          </div>
          <TokenIcon ticker="WETH" />
        </div>
      </div>
      <div className="space-y-3">
        <div className="text-muted-foreground">
          {side === 'buy' ? 'With' : 'For'}
        </div>
        <div className="flex items-center justify-between">
          <div className="font-serif text-3xl font-bold">USDC</div>
          <TokenIcon ticker="USDC" />
        </div>
      </div>
      <Separator />
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-muted-foreground">Receive at least</div>
          <div className="">--</div>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-muted-foreground">Type</div>
          <div className="">Midpoint Peg</div>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-muted-foreground">Est. time to fill</div>
          <div className="">--</div>
        </div>
      </div>
      <Separator />
      <div className="space-y-3">
        <FeesSection amount={amount} base={base} />
      </div>
    </>
  )
}
