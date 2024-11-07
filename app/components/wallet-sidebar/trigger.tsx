import { PanelRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useSidebar } from "@/components/ui/sidebar"

import { WalletReadyState, useWallets } from "@/hooks/use-wallets"

export function SidebarTrigger() {
  const { toggleSidebar } = useSidebar()
  const { arbitrumWallet, walletReadyState } = useWallets()

  if (walletReadyState !== WalletReadyState.READY) return null

  return (
    <Button
      className="group gap-2"
      variant="outline"
      onClick={toggleSidebar}
    >
      <PanelRight className="h-4 w-4" />
      <span>{arbitrumWallet.label}</span>
    </Button>
  )
}
