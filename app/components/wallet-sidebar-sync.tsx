"use client"

import React from "react"

import { useSidebar } from "@/components/ui/sidebar"

import { useWallets } from "@/hooks/use-wallets"

export function WalletSidebarSync() {
  const { isWalletsSynced } = useWallets()
  const { setOpen } = useSidebar()

  React.useEffect(() => {
    if (!isWalletsSynced) {
      setOpen(false)
    }
  }, [isWalletsSynced, setOpen])
  return null
}
