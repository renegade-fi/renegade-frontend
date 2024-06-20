import * as React from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { useMediaQuery } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'
import { Label } from '@radix-ui/react-label'
import { tokenMapping } from '@renegade-fi/react/constants'

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function SelectScrollable() {
  React.useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      console.log('scrolling')
      if ((e.target as Element).closest('[data-scrollable]')) return
      e.stopPropagation()
    }

    const handleTouchMove = (e: TouchEvent) => {
      if ((e.target as Element).closest('[data-scrollable]')) return
      e.stopPropagation()
    }

    document.addEventListener('wheel', handleWheel, true)
    document.addEventListener('touchmove', handleTouchMove, true)

    return () => {
      document.removeEventListener('wheel', handleWheel, true)
      document.removeEventListener('touchmove', handleTouchMove, true)
    }
  }, [])
  return (
    <Select>
      <SelectTrigger className="">
        <SelectValue placeholder="Select a token" />
      </SelectTrigger>
      <SelectContent className=" ">
        <SelectGroup>
          <SelectLabel>Tokens</SelectLabel>
          {tokenMapping.tokens.map(token => (
            <SelectItem value={token.address} key={token.address}>
              {token.ticker}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

export function DepositDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  const isDesktop = useMediaQuery('(min-width: 768px)')

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="max-h-[80vh] p-6 sm:max-w-[425px]">
          <DialogHeader className="space-y-4">
            <DialogTitle className="font-extended">Deposit</DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>
          <SelectScrollable />
          {/* <TransferForm /> */}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle className="font-extended">Dialog</DrawerTitle>
          <DrawerDescription>
            <Input placeholder="Search name" />
          </DrawerDescription>
        </DrawerHeader>
        <TransferForm />
        <DrawerFooter className="pt-2">
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

function TransferForm({ className }: React.ComponentProps<'form'>) {
  return (
    <div className={cn('space-y-8', className)}>
      <div className="grid w-full max-w-sm items-center gap-3">
        <Label htmlFor="email">Token</Label>
        <SelectScrollable />
      </div>
      <div className="grid w-full max-w-sm items-center gap-3">
        <Label htmlFor="email">Amount</Label>
        <Input
          type="email"
          id="email"
          placeholder="0.0"
          className="font-mono"
        />
        <div className="flex justify-between">
          <div className="text-sm text-muted-foreground">Arbitrum Balance</div>
          <div className="font-mono text-sm">23 WETH</div>
        </div>
      </div>
    </div>
  )
}
