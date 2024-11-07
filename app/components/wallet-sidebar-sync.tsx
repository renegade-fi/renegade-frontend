"use client"

import React from "react"

import { useSidebar } from "@/components/ui/sidebar"

import { WalletReadyState, useWallets } from "@/hooks/use-wallets"

export function WalletSidebarSync() {
  const { walletReadyState } = useWallets()
  const { setOpen } = useSidebar()
  React.useEffect(() => {
    if (walletReadyState !== WalletReadyState.READY) {
      setOpen(false)
    }
  }, [walletReadyState, setOpen])
  return null
}
