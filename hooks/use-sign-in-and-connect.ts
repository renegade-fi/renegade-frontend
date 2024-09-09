import { useState } from "react"

import { useConfig, useStatus } from "@renegade-fi/react"
import { disconnect as disconnectRenegade } from "@renegade-fi/react/actions"
import { useModal } from "connectkit"
import { useAccount, useDisconnect } from "wagmi"

export function useSignInAndConnect() {
  const { address } = useAccount()
  const config = useConfig()
  const { disconnect } = useDisconnect()
  const { setOpen } = useModal()
  const [open, setOpenSignIn] = useState(false)

  const renegadeStatus = useStatus()

  const handleClick = () => {
    if (address) {
      if (renegadeStatus === "in relayer") {
        disconnectRenegade(config)
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
    if (renegadeStatus === "in relayer") {
      content = `Disconnect ${address?.slice(0, 6)}`
    } else {
      content = `Sign in`
    }
  } else {
    content = "Connect Wallet"
  }

  return { handleClick, content, open, onOpenChange: setOpenSignIn }
}
