"use client"

import { PanelRightClose, PanelRightOpen } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useSidebar } from "@/components/ui/sidebar"

import { useWallets } from "@/hooks/use-wallets"
import { formatAddress } from "@/lib/format"
import { cn } from "@/lib/utils"

export function SidebarTrigger() {
  const { toggleSidebar, state } = useSidebar()
  const { arbitrumWallet, isWalletsSynced } = useWallets()

  if (!isWalletsSynced) return null

  return (
    <Button
      className="group gap-2"
      variant="outline"
      onClick={toggleSidebar}
    >
      <div className="relative h-4 w-4">
        <PanelRightOpen
          className={cn(
            "absolute h-4 w-4 transition-all duration-200",
            state === "expanded"
              ? "scale-75 opacity-0"
              : "scale-100 opacity-100",
          )}
        />
        <PanelRightClose
          className={cn(
            "absolute h-4 w-4 transition-all duration-200",
            state === "expanded"
              ? "scale-100 opacity-100"
              : "scale-75 opacity-0",
          )}
        />
      </div>
      <span>{formatAddress(arbitrumWallet.label)}</span>
    </Button>
  )
}
