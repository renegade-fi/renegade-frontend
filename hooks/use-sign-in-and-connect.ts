import { useState } from "react"

import { useConfig } from "@renegade-fi/react"
import { disconnect as disconnectRenegade } from "@renegade-fi/react/actions"
import { useModal } from "connectkit"
import { useAccount, useDisconnect } from "wagmi"

import { useRenegadeStatus } from "./use-renegade-status"

export function useSignInAndConnect() {
  const { address } = useAccount()
  const config = useConfig()
  const { isConnected } = useRenegadeStatus()
  const { disconnect } = useDisconnect()
  const { setOpen } = useModal()
  const [open, setOpenSignIn] = useState(false)

  const handleClick = () => {
    if (address) {
      if (isConnected) {
        if (config) {
          disconnectRenegade(config)
        }
        disconnect()
      } else {
        setOpenSignIn(true)
      }
    } else {
      setOpen(true)
    }
  }

  let content = ""
  if (address) {
    if (isConnected) {
      content = `Disconnect ${address?.slice(0, 6)}`
    } else {
      content = `Sign in`
    }
  } else {
    content = "Connect Wallet"
  }

  return { handleClick, content, open, onOpenChange: setOpenSignIn }
}
