"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { useStatus } from "@renegade-fi/react"
import { ChevronDown, Ellipsis } from "lucide-react"
import { useAccount } from "wagmi"

import { AccountDropdown } from "@/app/components/account-menu"
import { ConnectWalletButton } from "@/app/components/connect-wallet-button"
import { SettingsPopover } from "@/app/trade/[base]/components/settings-popover"

import { TransferDialog } from "@/components/dialogs/transfer/transfer-dialog"
import { Button } from "@/components/ui/button"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"

import { cn } from "@/lib/utils"

export function Header() {
  const pathname = usePathname()
  const status = useStatus()
  const { address } = useAccount()
  return (
    <header className="fixed top-0 z-10 min-w-full border-b bg-background">
      <div className="grid min-h-20 grid-cols-3 items-center">
        <div className="w-fit pl-6">
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
                <Button
                  className="font-extended"
                  variant="outline"
                >
                  Deposit
                </Button>
              </TransferDialog>
            </>
          )}
          {address ? (
            <AccountDropdown>
              <Button variant="outline">
                {`${address.slice(0, 6)}...${address.slice(-4)}`}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </AccountDropdown>
          ) : (
            <ConnectWalletButton />
          )}
          {status === "in relayer" && (
            <SettingsPopover>
              <Button
                className=""
                size="icon"
                variant="outline"
              >
                <Ellipsis className="h-4 w-4 text-muted-foreground" />
              </Button>
            </SettingsPopover>
          )}
        </div>
      </div>
    </header>
  )
}
