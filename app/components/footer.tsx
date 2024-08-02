"use client"

import Image from "next/image"

import { toast } from "sonner"
import { useAccount } from "wagmi"

import { Button } from "@/components/ui/button"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"

import { fundList, fundWallet } from "@/lib/utils"

export function Footer() {
  const { address } = useAccount()
  return (
    <footer className="fixed bottom-0 z-10 min-w-full border-t bg-background">
      <div className="grid min-h-20 grid-cols-2 items-center">
        <div className="flex pl-6">
          <ContextMenu>
            <ContextMenuTrigger>
              <Image
                src="/logo_dark.svg"
                alt="logo"
                width="192"
                height="30"
                priority
              />
            </ContextMenuTrigger>
            <ContextMenuContent alignOffset={1000} className="rounded-none">
              <ContextMenuItem
                className="rounded-none font-extended"
                onClick={() => {
                  window.open("https://renegade.fi/logos.zip", "_blank")
                }}
              >
                Download Logo Pack
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        </div>
        <div className="ml-auto space-x-2 pr-20 text-xs">
          <Button
            className="p-0 text-muted-foreground hover:text-foreground"
            variant="link"
            onClick={() => {
              if (!address) {
                toast.error("Please connect your wallet to fund your account.")
                return
              }

              toast.promise(fundWallet(fundList.slice(0, 2), address), {
                loading: "Funding account...",
                success: "Successfully funded account.",
                error:
                  "Funding failed: An unexpected error occurred. Please try again.",
              })

              // Fund additional wallets in background
              fundWallet(fundList.slice(2), address)
            }}
          >
            Faucet
          </Button>
          <Button
            className="p-0 text-muted-foreground hover:text-foreground"
            variant="link"
            asChild
          >
            <a href="https://x.com/renegade_fi" target="_blank">
              Twitter
            </a>
          </Button>
          <Button
            className="p-0 text-muted-foreground hover:text-foreground"
            variant="link"
            asChild
          >
            <a href="https://discord.com/invite/renegade-fi" target="_blank">
              Discord
            </a>
          </Button>
          <Button
            className="p-0 text-muted-foreground hover:text-foreground"
            variant="link"
            asChild
          >
            <a href="https://github.com/renegade-fi/" target="_blank">
              GitHub
            </a>
          </Button>
          <Button
            className="p-0 text-muted-foreground hover:text-foreground"
            variant="link"
            asChild
          >
            <a href="https://docs.renegade.fi/" target="_blank">
              Docs
            </a>
          </Button>
        </div>
      </div>
    </footer>
  )
}
