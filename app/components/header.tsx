"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { useStatus } from "@renegade-fi/react"
import { ChevronDown, Ellipsis, Menu } from "lucide-react"
import { mainnet } from "viem/chains"
import { createConfig, http, useAccount, useEnsName } from "wagmi"

import { AccountDropdown } from "@/app/components/account-menu"
import { ConnectWalletButton } from "@/app/components/connect-wallet-button"
import { MobileNavSheet } from "@/app/components/mobile-nav-sheet"
import { SettingsDropdown } from "@/app/trade/[base]/components/settings-dropdown"

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

  // Fetch ENS name from mainnet
  const config = createConfig({
    chains: [mainnet],
    transports: {
      [mainnet.id]: http(),
    },
  })
  const { data: ensName } = useEnsName({
    address,
    config,
  })
  return (
    <header className="fixed top-0 z-10 min-w-full border-b bg-background">
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
          {address ? (
            <AccountDropdown>
              <Button variant="outline">
                {ensName
                  ? ensName
                  : `${address.slice(0, 6)}...${address.slice(-2)}`}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </AccountDropdown>
          ) : (
            <ConnectWalletButton className="text-sm" />
          )}
          {status === "in relayer" && (
            <SettingsDropdown>
              <Button
                size="icon"
                variant="outline"
              >
                <Ellipsis className="h-4 w-4 text-muted-foreground" />
              </Button>
            </SettingsDropdown>
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
                {ensName
                  ? ensName
                  : `${address.slice(0, 6)}...${address.slice(-4)}`}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </AccountDropdown>
          ) : (
            <ConnectWalletButton />
          )}
          {status === "in relayer" && (
            <SettingsDropdown>
              <Button
                size="icon"
                variant="outline"
              >
                <Ellipsis className="h-4 w-4 text-muted-foreground" />
              </Button>
            </SettingsDropdown>
          )}
        </div>
      </div>
    </header>
  )
}
