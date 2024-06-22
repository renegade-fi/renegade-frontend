import * as React from 'react'

import { useCreateOrder } from '@/hooks/use-create-order'
import { useMediaQuery } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'

import { GlowText } from '@/components/glow-text'
import { TokenIcon } from '@/components/token-icon'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

export function NewOrderDialog({
  base,
  side,
  amount,
  clearAmount,
  children,
}: {
  base: string
  side: string
  amount: string
  clearAmount: () => void
  children: React.ReactNode
}) {
  const [open, setOpen] = React.useState(false)
  const isDesktop = useMediaQuery('(min-width: 768px)')

  const handleCreateOrer = useCreateOrder({
    base,
    side,
    amount,
    setOpen,
    clearAmount,
  })

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="max-h-[80vh] p-0 sm:max-w-[425px]">
          <DialogHeader className="space-y-4 px-6 pt-6">
            <DialogTitle className="font-extended">Review Order</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            <NewOrderForm
              base={base}
              side={side}
              amount={amount}
              className="p-6"
            />
          </ScrollArea>
          <DialogFooter>
            <Button
              onClick={handleCreateOrer}
              variant="outline"
              className="flex-1 border-x-0 border-b-0 border-t font-extended text-2xl"
              size="xl"
            >
              {side === 'buy' ? 'Buy' : 'Sell'} {base}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open onOpenChange={setOpen}>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle className="font-extended">Review Order</DrawerTitle>
        </DrawerHeader>
        <ScrollArea className="max-h-[60vh] overflow-auto">
          <NewOrderForm
            base={base}
            side={side}
            amount={amount}
            className="p-6"
          />
        </ScrollArea>
        <DrawerFooter className="pt-2">
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

function NewOrderForm({
  base,
  side,
  amount,
  className,
}: React.ComponentProps<'form'> & {
  base: string
  side: string
  amount: string
}) {
  return (
    <div className={cn('space-y-6', className)}>
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
          <div className="">$123.45</div>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-muted-foreground">Type</div>
          <div className="">Midpoint Peg</div>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-muted-foreground">Est. time to fill</div>
          <div className="">&lt;1min</div>
        </div>
      </div>
      <Separator />
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="">Est. fees</div>
          <div className="">$12.45</div>
        </div>
        <div className="flex items-center justify-between">
          <div className="">Est. cost to trade on Binance</div>
          <div className="">$23.45</div>
        </div>
        <div className="flex items-center justify-between">
          <div className="">Est. $ savings vs. Binance</div>
          <GlowText className="bg-green-price" text="$10.87" />
        </div>
      </div>
    </div>
  )
}
