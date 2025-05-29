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
import { useSidebar } from "@/components/ui/sidebar"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { useChain } from "@/hooks/use-chain"
import { FAUCET_TOOLTIP } from "@/lib/constants/tooltips"
import { fundList, fundWallet } from "@/lib/utils"
import { isTestnet } from "@/lib/viem"

export function Footer() {
  const { address } = useAccount()
  const { state } = useSidebar()
  const chainId = useChain()?.id

  return (
    <footer className="relative hidden min-h-20 min-w-full bg-background before:absolute before:left-0 before:right-0 before:top-0 before:h-[1px] before:bg-border lg:block">
      <div className="grid min-h-20 grid-cols-2 items-center">
        <div className="hidden items-center pl-6 lg:flex">
          <ContextMenu>
            <ContextMenuTrigger>
              <Image
                priority
                alt="logo"
                height="30"
                src="/logo_dark.svg"
                width="192"
              />
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
          {isTestnet && (
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

                    toast.promise(
                      fundWallet(fundList.slice(0, 2), address, chainId),
                      {
                        loading: "Funding account...",
                        success: "Successfully funded account.",
                        error:
                          "Funding failed: An unexpected error occurred. Please try again.",
                      },
                    )

                    // Fund additional wallets in background
                    fundWallet(fundList.slice(2), address, chainId)
                  }}
                >
                  Faucet
                </Button>
              </TooltipTrigger>
              <TooltipContent>{FAUCET_TOOLTIP}</TooltipContent>
            </Tooltip>
          )}
        </div>
        <div
          className={`ml-2 flex text-xs transition-[padding] duration-200 ease-linear lg:ml-auto ${
            state === "collapsed" ? "lg:pr-[140px]" : "lg:pr-4"
          }`}
        >
          <Button
            asChild
            size="icon"
            variant="ghost"
          >
            <a
              href="https://x.com/renegade_fi"
              rel="noreferrer"
              target="_blank"
            >
              <Image
                alt="x"
                height="12"
                src="/x.svg"
                width="12"
              />
            </a>
          </Button>
          <Button
            asChild
            size="icon"
            variant="ghost"
          >
            <a
              href="https://github.com/renegade-fi/"
              rel="noreferrer"
              target="_blank"
            >
              <Image
                alt="github"
                height="12"
                src="/github.svg"
                width="12"
              />
            </a>
          </Button>
          <Button
            asChild
            size="icon"
            variant="ghost"
          >
            <a
              href="https://discord.com/invite/renegade-fi"
              rel="noreferrer"
              target="_blank"
            >
              <Image
                alt="discord"
                height="12"
                src="/discord.svg"
                width="12"
              />
            </a>
          </Button>
          <Button
            asChild
            size="icon"
            variant="ghost"
          >
            <a
              href="https://renegade.fi/docs"
              rel="noreferrer"
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
