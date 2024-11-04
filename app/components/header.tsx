"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { Menu } from "lucide-react"

import { ConnectWalletButton } from "@/app/components/connect-wallet-button"
import { MobileNavSheet } from "@/app/components/mobile-nav-sheet"
import { SidebarTrigger } from "@/app/components/wallet-sidebar/trigger"

import { TransferDialog } from "@/components/dialogs/transfer/transfer-dialog"
import { Button } from "@/components/ui/button"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"

import { WalletReadyState, useWallets } from "@/hooks/use-wallets"
import { cn } from "@/lib/utils"

export function Header() {
  const pathname = usePathname()
  const { walletReadyState } = useWallets()

  return (
    <header className="sticky top-0 z-10 h-20 min-w-full shrink-0 border-b bg-background">
      <div className="flex min-h-20 items-center justify-between pl-2 pr-4 lg:hidden">
        <div className="flex items-center gap-2">
          <MobileNavSheet>
            <Button
              size="icon"
              variant="ghost"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </MobileNavSheet>

          <Image
            priority
            alt="logo"
            height="28"
            src="/glyph_dark.svg"
            width="24"
          />
        </div>
        <div className="flex items-center gap-2">
          {walletReadyState === WalletReadyState.READY ? (
            <SidebarTrigger />
          ) : (
            <ConnectWalletButton className="text-sm" />
          )}
        </div>
      </div>
      <div className="hidden min-h-20 grid-cols-3 items-center px-6 lg:grid">
        <div className="w-fit">
          <ContextMenu>
            <ContextMenuTrigger>
              <Link href="/trade">
                <Image
                  priority
                  alt="logo"
                  height="38"
                  src="/glyph_dark.svg"
                  width="31"
                />
              </Link>
            </ContextMenuTrigger>
            <ContextMenuContent
              alignOffset={1000}
              className="rounded-none"
            >
              <ContextMenuItem
                className="rounded-none font-extended"
                onClick={() => {
                  window.open("/logos.zip", "_blank")
                }}
              >
                Download Logo Pack
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        </div>
        <nav className="flex space-x-5 justify-self-center font-extended text-muted-foreground">
          <Link
            className={cn("hover:underline", {
              "text-primary": pathname === "/" || pathname.includes("/trade"),
            })}
            href="/trade"
          >
            Trade
          </Link>
          <Link
            className={cn("hover:underline", {
              "text-primary": pathname.includes("/assets"),
            })}
            href="/assets"
          >
            Assets
          </Link>
          <Link
            className={cn("hover:underline", {
              "text-primary": pathname.includes("/orders"),
            })}
            href="/orders"
          >
            Orders
          </Link>
          <Link
            className={cn("hover:underline", {
              "text-primary": pathname.includes("/stats"),
            })}
            href="/stats"
          >
            Stats
          </Link>
        </nav>
        <div className="flex items-center space-x-4 justify-self-end">
          {walletReadyState === WalletReadyState.READY ? (
            <>
              <TransferDialog>
                <Button
                  className="font-extended"
                  variant="outline"
                >
                  Deposit
                </Button>
              </TransferDialog>
              <SidebarTrigger />
            </>
          ) : (
            <ConnectWalletButton />
          )}
        </div>
      </div>
    </header>
  )
}
