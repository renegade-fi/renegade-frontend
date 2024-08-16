import * as React from "react"

import Link from "next/link"

import { useStatus, useWallet } from "@renegade-fi/react"
import { Star } from "lucide-react"
import { useDebounceValue, useLocalStorage } from "usehooks-ts"
import { fromHex } from "viem/utils"

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
import { STORAGE_FAVORITES } from "@/lib/constants/storage"
import { formatNumber } from "@/lib/format"
import { DISPLAY_TOKENS } from "@/lib/token"

export function TokenSelectDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [debouncedSearchTerm] = useDebounceValue(searchTerm, 300)
  const isDesktop = useMediaQuery("(min-width: 768px)")

  if (isDesktop) {
    return (
      <Dialog
        open={open}
        onOpenChange={setOpen}
      >
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="max-h-[70vh] p-0 sm:max-w-[425px]">
          <DialogHeader className="space-y-4 px-6 pt-6">
            <DialogTitle className="font-extended">Select Token</DialogTitle>
            <DialogDescription>
              <Input
                placeholder="Search name"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[50vh] min-h-[50vh]">
            <TokenList
              enabled={open}
              searchTerm={debouncedSearchTerm}
            />
          </ScrollArea>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer
      open={open}
      onOpenChange={setOpen}
    >
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle className="font-extended">Select Token</DrawerTitle>
          <DrawerDescription>
            <Input placeholder="Search name" />
          </DrawerDescription>
        </DrawerHeader>
        <ScrollArea className="max-h-[50vh] overflow-auto">
          <TokenList
            enabled={open}
            searchTerm={debouncedSearchTerm}
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

function TokenList({
  enabled,
  searchTerm,
}: {
  enabled: boolean
  searchTerm: string
}) {
  const renegadeStatus = useStatus()
  const { data, status } = useWallet({
    query: {
      select: (data) =>
        new Map(
          data.balances
            .filter((balance) => !!fromHex(balance.mint, "number"))
            .map((balance) => [balance.mint, balance.amount]),
        ),
      enabled,
    },
  })

  const [favorites, setFavorites] = useLocalStorage<string[]>(
    STORAGE_FAVORITES,
    [],
    { initializeWithValue: false },
  )

  const processedTokens = React.useMemo(() => {
    return DISPLAY_TOKENS({
      hideHidden: true,
      hideStables: true,
    })
      .sort((a, b) => {
        const balanceA = data?.get(a.address) ?? BigInt(0)
        const balanceB = data?.get(b.address) ?? BigInt(0)
        const isAFavorite = favorites.includes(a.address)
        const isBFavorite = favorites.includes(b.address)

        // Prioritize favorites
        if (isAFavorite && !isBFavorite) return -1
        if (!isAFavorite && isBFavorite) return 1

        // If both are favorites or both are not favorites, prioritize non-zero balances
        if (balanceA !== BigInt(0) && balanceB === BigInt(0)) return -1
        if (balanceA === BigInt(0) && balanceB !== BigInt(0)) return 1

        // If both have the same favorite status and balance status, maintain original order
        return 0
      })
      .filter(
        (token) =>
          token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          token.ticker.toLowerCase().includes(searchTerm.toLowerCase()),
      )
  }, [data, searchTerm, favorites])

  return (
    <div className="grid items-start">
      {processedTokens.length ? (
        processedTokens.map((token, index) => {
          const balance = data?.get(token.address)
          const formattedBalance =
            status === "pending" || renegadeStatus !== "in relayer"
              ? "--"
              : formatNumber(balance ?? BigInt(0), token.decimals, true)
          return (
            <div
              className="flex items-center gap-4 px-6 py-2 transition-colors hover:bg-accent hover:text-accent-foreground"
              key={token.address}
            >
              <Link
                href={`/trade/${token.ticker}`}
                className="w-full"
                key={token.address}
              >
                <div className="grid grid-cols-[32px_1fr_1fr] items-center gap-4">
                  <TokenIcon ticker={token.ticker} />
                  <div>
                    <p className="text-md font-medium">{token.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {token.ticker}
                    </p>
                  </div>
                  <div className="justify-self-end font-mono">
                    {formattedBalance}
                  </div>
                </div>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setFavorites((favorites) => {
                    if (favorites.includes(token.address)) {
                      return favorites.filter(
                        (address) => address !== token.address,
                      )
                    }
                    return [...favorites, token.address]
                  })
                }}
              >
                <Star
                  className="h-4 w-4"
                  fill={favorites.includes(token.address) ? "white" : "none"}
                />
              </Button>
            </div>
          )
        })
      ) : (
        <div className="px-6 py-2 text-center">No results found.</div>
      )}
    </div>
  )
}
