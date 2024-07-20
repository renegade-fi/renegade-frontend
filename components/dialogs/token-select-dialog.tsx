import * as React from "react"

import Link from "next/link"

import { useQueryClient } from "@tanstack/react-query"
import { useAccount, useBlockNumber, useReadContracts } from "wagmi"

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
import { erc20Abi } from "@/lib/generated"
import { DISPLAY_TOKENS } from "@/lib/token"

export function TokenSelectDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  const isDesktop = useMediaQuery("(min-width: 768px)")

  const { address } = useAccount()
  const { data, queryKey } = useReadContracts({
    contracts: DISPLAY_TOKENS().map(token => ({
      address: token.address,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [address],
    })),
    query: {
      enabled: !!address && open,
      select: data =>
        data.map((balance, index) => ({
          balance: balance.result ?? BigInt(0),
          token: DISPLAY_TOKENS()[index],
        })),
    },
  })

  const queryClient = useQueryClient()
  const blockNumber = useBlockNumber({ watch: true })

  React.useEffect(() => {
    if (blockNumber) {
      queryClient.invalidateQueries({ queryKey })
    }
  }, [blockNumber, queryClient, queryKey])

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
            <TokenList tokens={data ?? []} />
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
          <TokenList tokens={data ?? []} />
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

function TokenList({
  tokens,
}: {
  tokens: {
    balance: bigint
    token: {
      name: string
      ticker: string
      address: `0x${string}`
      decimals: number
    }
  }[]
}) {
  const sortedTokens = tokens.sort((a, b) => {
    if (a.balance === BigInt(0) && b.balance !== BigInt(0)) return 1
    if (a.balance !== BigInt(0) && b.balance === BigInt(0)) return -1
    return 0
  })
  return (
    <div className="grid items-start">
      {sortedTokens.map(({ balance, token }) => (
        <Link href={`/trade/${token.ticker}`} key={token.address}>
          <div className="grid grid-cols-[32px_1fr_1fr] items-center gap-4 px-6 py-2 transition-colors hover:bg-accent hover:text-accent-foreground">
            <TokenIcon ticker={token.ticker} />
            <div>
              <p className="text-md font-medium">{token.name}</p>
              <p className="text-xs text-muted-foreground">{token.ticker}</p>
            </div>
            <div className="justify-self-end font-mono">
              {formatNumber(balance, token.decimals, true)}
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
