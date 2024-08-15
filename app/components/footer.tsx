"use client"

import Image from "next/image"

import { Book } from "lucide-react"
import { toast } from "sonner"
import { useAccount } from "wagmi"

import { Button } from "@/components/ui/button"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { FAUCET_TOOLTIP } from "@/lib/constants/tooltips"
import { fundList, fundWallet } from "@/lib/utils"

export function Footer() {
  const { address } = useAccount()
  return (
    <footer className="fixed bottom-0 z-10 min-w-full border-t bg-background">
      <div className="grid min-h-20 grid-cols-2 items-center">
        <div className="flex items-center pl-6">
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
            <ContextMenuContent
              alignOffset={1000}
              className="rounded-none"
            >
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
          <Tooltip>
            <TooltipTrigger
              asChild
              className="cursor-pointer"
            >
              <Button
                className="ml-4 font-extended"
                variant="outline"
                onClick={() => {
                  if (!address) {
                    toast.error(
                      "Please connect your wallet to fund your account.",
                    )
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
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-sans">{FAUCET_TOOLTIP}</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="ml-auto pr-20 text-xs">
          <Button
            asChild
            variant="ghost"
            size="icon"
          >
            <a
              href="https://x.com/renegade_fi"
              target="_blank"
            >
              <Image
                alt="x"
                height="12"
                width="12"
                src="/x.svg"
              />
            </a>
          </Button>
          <Button
            size="icon"
            variant="ghost"
            asChild
          >
            <a
              href="https://github.com/renegade-fi/"
              target="_blank"
            >
              <Image
                alt="github"
                height="12"
                width="12"
                src="/github.svg"
              />
            </a>
          </Button>
          <Button
            variant="ghost"
            asChild
            size="icon"
          >
            <a
              href="https://discord.com/invite/renegade-fi"
              target="_blank"
            >
              <Image
                alt="discord"
                height="12"
                width="12"
                src="/discord.svg"
              />
            </a>
          </Button>
          <Button
            size="icon"
            variant="ghost"
            asChild
          >
            <a
              href="https://renegade.fi/docs"
              target="_blank"
            >
              <Book className="h-3 w-3" />
            </a>
          </Button>
        </div>
      </div>
    </footer>
  )
}
