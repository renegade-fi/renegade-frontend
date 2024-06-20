import * as React from 'react'

import { TokenIcon } from '@/components/token-icon'
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
import { ScrollArea } from '@/components/ui/scroll-area'
import { useMediaQuery } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'
import { tokenMapping } from '@renegade-fi/react/constants'
import Link from 'next/link'

export function TokenSelectDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  const isDesktop = useMediaQuery('(min-width: 768px)')

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="max-h-[80vh] p-0 sm:max-w-[425px]">
          <DialogHeader className="space-y-4 px-6 pt-6">
            <DialogTitle className="font-extended">Select Token</DialogTitle>
            <DialogDescription>
              <Input placeholder="Search name" />
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <TokenList />
          </ScrollArea>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle className="font-extended">Select Token</DrawerTitle>
          <DrawerDescription>
            <Input placeholder="Search name" />
          </DrawerDescription>
        </DrawerHeader>
        <ScrollArea className="max-h-[60vh] overflow-auto">
          <TokenList />
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

function TokenList({ className }: React.ComponentProps<'form'>) {
  return (
    <div className={cn('grid items-start', className)}>
      {tokenMapping.tokens.map(token => (
        <Link href={`/trade/${token.ticker}`} key={token.address}>
          <div className="grid grid-cols-[32px_1fr_1fr] items-center gap-4 px-6 py-2 transition-colors hover:bg-accent hover:text-accent-foreground">
            <TokenIcon ticker={token.ticker} />
            <div>
              <p className="text-md font-medium">{token.name}</p>
              <p className="text-xs text-muted-foreground">{token.ticker}</p>
            </div>
            <div className="justify-self-end font-mono">17123.56</div>
          </div>
        </Link>
      ))}
    </div>
  )
}
