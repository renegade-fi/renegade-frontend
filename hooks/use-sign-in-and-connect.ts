import { useState } from "react"

import { useModal } from "connectkit"
import { useAccount } from "wagmi"

import { useServerStore } from "@/providers/state-provider/server-store-provider"

import { useRenegadeStatus } from "./use-renegade-status"

export function useSignInAndConnect() {
  const { address, isConnected: isWagmiConnected } = useAccount()
  const { isConnected: isRenegadeConnected } = useRenegadeStatus()
  const resetWallet = useServerStore((state) => state.resetWallet)
  const { setOpen } = useModal()
  const [open, setOpenSignIn] = useState(false)

  const handleClick = () => {
    if (isWagmiConnected) {
      if (isRenegadeConnected) {
        resetWallet()
      } else {
        setOpenSignIn(true)
      }
    } else {
      setOpen(true)
    }
  }

  let content = ""
  if (address) {
    if (isRenegadeConnected) {
      content = `Disconnect ${address?.slice(0, 6)}`
    } else {
      content = `Sign in`
    }
  } else {
    content = "Connect Wallet"
  }

  return { handleClick, content, open, onOpenChange: setOpenSignIn }
}
