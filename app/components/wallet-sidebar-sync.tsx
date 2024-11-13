"use client"

import React from "react"

import { useSidebar } from "@/components/ui/sidebar"

import { useWallets } from "@/hooks/use-wallets"

export function WalletSidebarSync() {
  const { renegadeWallet, arbitrumWallet } = useWallets()
  const { setOpen } = useSidebar()
  React.useEffect(() => {
    if (!renegadeWallet.isConnected && !arbitrumWallet.isConnected) {
      setOpen(false)
    }
  }, [arbitrumWallet.isConnected, renegadeWallet.isConnected, setOpen])
  return null
}
