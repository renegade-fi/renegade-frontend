import * as React from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
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

enum ExternalTransferDirection {
  Deposit,
  Withdraw,
}

export function TransferDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const [direction, setDirection] = React.useState<ExternalTransferDirection>(
    ExternalTransferDirection.Deposit,
  )

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen} modal>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="max-h-[80vh] gap-0 p-0 sm:max-w-[425px]">
          <DialogHeader>
            <div className="flex flex-row border-b border-border">
              <Button
                variant="outline"
                className={cn(
                  'flex-1 border-0 font-extended text-lg font-bold',
                  direction === ExternalTransferDirection.Deposit
                    ? 'text-primary'
                    : 'text-muted-foreground',
                )}
                size="xl"
                onClick={() => setDirection(ExternalTransferDirection.Deposit)}
              >
                Deposit
              </Button>
              <Button
                variant="outline"
                className={cn(
                  'border-l-1 flex-1 border-y-0 border-r-0 font-extended text-lg font-bold',
                  direction === ExternalTransferDirection.Withdraw
                    ? 'text-primary'
                    : 'text-muted-foreground',
                )}
                size="xl"
                onClick={() => setDirection(ExternalTransferDirection.Withdraw)}
              >
                Withdraw
              </Button>
            </div>
          </DialogHeader>
          <TransferForm className="p-6" direction={direction} />
          <DialogFooter>
            <Button
              variant="outline"
              className="flex-1 border-x-0 border-b-0 border-t font-extended text-2xl"
              size="xl"
            >
              {direction === ExternalTransferDirection.Deposit
                ? 'Deposit'
                : 'Withdraw'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline">Deposit</Button>
      </DrawerTrigger>
      <DrawerContent hideHandle>
        <DrawerHeader className="p-0">
          <div className="flex flex-row border-b border-border">
            <Button
              variant="outline"
              className="flex-1 border-0 font-extended text-lg font-bold"
              size="xl"
              onClick={() => setDirection(ExternalTransferDirection.Deposit)}
            >
              Deposit
            </Button>
            <Button
              variant="outline"
              className="border-l-1 flex-1 border-y-0 border-r-0 font-extended text-lg font-bold"
              size="xl"
              onClick={() => setDirection(ExternalTransferDirection.Withdraw)}
            >
              Withdraw
            </Button>
          </div>
        </DrawerHeader>
        <TransferForm className="p-6" direction={direction} />
        <DrawerFooter className="pt-2">
          <Button>
            {direction === ExternalTransferDirection.Deposit
              ? 'Deposit'
              : 'Withdraw'}
          </Button>
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

function TransferForm({
  className,
  direction,
}: React.ComponentProps<'form'> & { direction: ExternalTransferDirection }) {
  return (
    <div className={cn('space-y-8', className)}>
      <div className="grid w-full items-center gap-3">
        <Label htmlFor="email">Token</Label>
        <TokenSelect />
      </div>
      <div className="grid w-full items-center gap-3">
        <Label htmlFor="email">Amount</Label>
        <Input
          type="email"
          id="email"
          placeholder="0.0"
          className="rounded-none font-mono"
        />
        <div className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            {direction === ExternalTransferDirection.Deposit
              ? 'Arbitrum'
              : 'Renegade'}
            &nbsp;Balance
          </div>
          <div className="font-mono text-sm">23 WETH</div>
        </div>
      </div>
    </div>
  )
}
