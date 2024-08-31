"use client"

import Link from "next/link"

import { Token } from "@renegade-fi/react"
import { Star } from "lucide-react"
import { useReadLocalStorage } from "usehooks-ts"
import { isAddress } from "viem/utils"

import { AnimatedPrice } from "@/components/animated-price"
import { Button } from "@/components/ui/button"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

import { STORAGE_FAVORITES } from "@/lib/constants/storage"

export function FavoritesBanner() {
  const favorites = useReadLocalStorage<string[]>(STORAGE_FAVORITES, {
    initializeWithValue: false,
  })
  if (!favorites || !favorites.length) return null
  return (
    <ScrollArea className="w-full whitespace-nowrap border-y bg-background font-extended text-sm">
      <div className="flex w-max items-center gap-8 p-2 pl-16">
        <div className="fixed bottom-20 left-3 inline-flex h-9 w-9 items-center justify-center text-muted-foreground">
          <Star className="h-3 w-3" />
        </div>
        {favorites.map((address, index) => {
          if (!isAddress(address)) return null
          const token = Token.findByAddress(address)
          return (
            <div
              key={address}
              className="flex items-center gap-8"
            >
              <Link href={`/trade/${token.ticker}`}>
                <span className="space-x-4">
                  <span>{token.ticker}</span>
                  <AnimatedPrice mint={token.address} />
                </span>
              </Link>
              {index < favorites.length - 1 && (
                <span className="text-xs">•</span>
              )}
            </div>
          )
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  )
}
