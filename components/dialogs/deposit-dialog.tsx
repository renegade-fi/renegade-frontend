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
import { TokenSelect } from '@/components/dialogs/token-select'

export function DepositDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  const isDesktop = useMediaQuery('(min-width: 768px)')

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen} modal>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="max-h-[80vh] p-6 sm:max-w-[425px]">
          <DialogHeader className="space-y-4">
            <DialogTitle className="font-extended">Deposit</DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>
          <TransferForm />
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline">Deposit</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>Deposit</DrawerTitle>
        </DrawerHeader>
        <TransferForm className="px-4" />
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
        <TokenSelect />
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
