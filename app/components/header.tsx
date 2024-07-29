"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { useStatus } from "@renegade-fi/react"

import { ConnectWalletButton } from "@/app/components/connect-wallet-button"

import { TransferDialog } from "@/components/dialogs/transfer-dialog"
import { Button } from "@/components/ui/button"

import { cn } from "@/lib/utils"

export function Header() {
  const pathname = usePathname()
  const status = useStatus()
  return (
    <header className="fixed top-0 z-10 min-w-full border-b bg-background">
      <div className="grid min-h-20 grid-cols-3 items-center">
        <div className="w-fit pl-6">
          <Link href="/trade">
            <Image
              src="/glyph_dark.svg"
              alt="logo"
              width="31"
              height="38"
              priority
            />
          </Link>
        </div>
        <nav className="flex space-x-5 justify-self-center font-extended text-muted-foreground">
          <Link
            href="/trade"
            className={cn("hover:underline", {
              "text-primary": pathname === "/" || pathname.includes("/trade"),
            })}
          >
            Trade
          </Link>
          <Link
            href="/assets"
            className={cn("hover:underline", {
              "text-primary": pathname.includes("/assets"),
            })}
          >
            Assets
          </Link>
          <Link
            href="/orders"
            className={cn("hover:underline", {
              "text-primary": pathname.includes("/orders"),
            })}
          >
            Orders
          </Link>
        </nav>
        <div className="flex items-center space-x-4 justify-self-end pr-4">
          {status === "in relayer" && (
            <>
              {/* <TaskHistorySheet>
                <Button
                  variant="ghost"
                  className="flex h-8 w-8 rounded-none p-0 data-[state=open]:bg-muted"
                >
                  <Bell className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </TaskHistorySheet> */}
              <TransferDialog>
                <Button className="font-extended" variant="outline">
                  Deposit
                </Button>
              </TransferDialog>
            </>
          )}
          <ConnectWalletButton />
        </div>
      </div>
    </header>
  )
}
