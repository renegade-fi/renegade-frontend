"use client"

import { useConfig } from "@renegade-fi/react"
import { disconnect as disconnectRenegade } from "@renegade-fi/react/actions"
import { useDisconnect } from "wagmi"

import { Button } from "@/components/ui/button"

import { useWalletOnboarding } from "../context/wallet-onboarding-context"

export function ConnectWalletButton() {
  const { isConnected, isWrongChain, isInRelayer, requiredStep, setIsOpen } =
    useWalletOnboarding()
  const { disconnect } = useDisconnect()
  const config = useConfig()

  // If all conditions are met, show disconnect button
  if (isConnected && !isWrongChain && isInRelayer) {
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

  // Otherwise show appropriate connection state button
  const buttonText = isConnected
    ? isWrongChain
      ? "Switch Network"
      : "Sign In"
    : "Connect Wallet"

  return (
    <Button onClick={() => setIsOpen(true, requiredStep)}>{buttonText}</Button>
  )
}
