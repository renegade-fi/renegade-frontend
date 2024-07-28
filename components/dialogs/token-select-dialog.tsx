import * as React from "react"

import Link from "next/link"

import { useWallet } from "@renegade-fi/react"
import { fromHex, hexToBool } from "viem/utils"

import { TokenIcon } from "@/components/token-icon"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"

import { useMediaQuery } from "@/hooks/use-media-query"
import { formatNumber } from "@/lib/format"
import { DISPLAY_TOKENS } from "@/lib/token"

export function TokenSelectDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  const isDesktop = useMediaQuery("(min-width: 768px)")
  const { data } = useWallet({
    query: {
      select: data =>
        new Map(
          data.balances
            .filter(balance => !!fromHex(balance.mint, "number"))
            .map(balance => [balance.mint, balance.amount]),
        ),
      enabled: open,
    },
  })

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="max-h-[70vh] p-0 sm:max-w-[425px]">
          <DialogHeader className="space-y-4 px-6 pt-6">
            <DialogTitle className="font-extended">Select Token</DialogTitle>
            <DialogDescription>
              <Input placeholder="Search name" />
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[50vh]">
            <TokenList balances={data} />
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
        <ScrollArea className="max-h-[50vh] overflow-auto">
          <TokenList balances={data} />
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

function TokenList({ balances }: { balances?: Map<`0x${string}`, bigint> }) {
  const sortedTokens = DISPLAY_TOKENS({
    hideHidden: true,
    hideStables: true,
  }).sort((a, b) => {
    const balanceA = balances?.get(a.address) ?? BigInt(0)
    const balanceB = balances?.get(b.address) ?? BigInt(0)
    if (balanceA === BigInt(0) && balanceB === BigInt(0)) return 0
    if (balanceA === BigInt(0)) return 1
    if (balanceB === BigInt(0)) return -1
    return 0
  })

  return (
    <div className="grid items-start">
      {sortedTokens.map((token, index) => {
        const balance = balances?.get(token.address)
        return (
          <Link href={`/trade/${token.ticker}`} key={token.address}>
            <div className="grid grid-cols-[32px_1fr_1fr] items-center gap-4 px-6 py-2 transition-colors hover:bg-accent hover:text-accent-foreground">
              <TokenIcon ticker={token.ticker} />
              <div>
                <p className="text-md font-medium">{token.name}</p>
                <p className="text-xs text-muted-foreground">{token.ticker}</p>
              </div>
              <div className="justify-self-end font-mono">
                {formatNumber(balance ?? BigInt(0), token.decimals, true)}
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
