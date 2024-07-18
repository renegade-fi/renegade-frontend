"use client"

import Image from "next/image"

import {
  DiscordLogoIcon,
  GitHubLogoIcon,
  TwitterLogoIcon,
} from "@radix-ui/react-icons"
import { Book } from "lucide-react"
import { toast } from "sonner"
import { useAccount } from "wagmi"

import { Button } from "@/components/ui/button"

import { fundList, fundWallet } from "@/lib/utils"

export function Footer() {
  const { address } = useAccount()
  return (
    <footer className="fixed bottom-0 z-10 min-w-full border-t bg-background">
      <div className="grid min-h-20 grid-cols-2 items-center">
        <div className="flex pl-6">
          <Image
            src="/logo_dark.svg"
            alt="logo"
            width="192"
            height="30"
            priority
          />
          <Button
            className="ml-4 font-extended"
            variant="outline"
            size="sm"
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
        </div>
        <div className="flex space-x-4 justify-self-end pr-6">
          <TwitterLogoIcon className="h-6 w-6" />
          <DiscordLogoIcon className="h-6 w-6" />
          <GitHubLogoIcon className="h-6 w-6" />
          <Book className="h-6 w-6" />
        </div>
      </div>
    </footer>
  )
}
