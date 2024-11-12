"use client"

import { useConfig } from "@renegade-fi/react"
import { disconnect as disconnectRenegade } from "@renegade-fi/react/actions"
import { useDisconnect } from "wagmi"

import { Button } from "@/components/ui/button"

export function DisconnectWalletButton() {
  const { disconnect } = useDisconnect()
  const config = useConfig()
  return (
    <Button
      variant="outline"
      onClick={() => {
        disconnect()
        disconnectRenegade(config)
      }}
    >
      Disconnect
    </Button>
  )
}
