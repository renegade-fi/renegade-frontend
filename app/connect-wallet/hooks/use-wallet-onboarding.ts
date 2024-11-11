import { useConfig } from "@renegade-fi/react"
import { useAccount, useDisconnect, useChainId } from "wagmi"

import { chain } from "@/lib/viem"

import { useWalletOnboarding } from "../context/wallet-onboarding-context"
import { OnboardingStep } from "../types"

interface WalletConnectionState {
  isConnected: boolean
  isWrongChain: boolean
  isInRelayer: boolean
  requiredStep: OnboardingStep
  disconnect: () => void
  openOnboarding: (step?: OnboardingStep) => void
}

export function useWalletConnection(): WalletConnectionState {
  const { isConnected } = useAccount()
  const chainId = useChainId()
  const { disconnect } = useDisconnect()
  const { setIsOpen } = useWalletOnboarding()
  const config = useConfig()

  const isWrongChain = chainId !== chain.id
  const isInRelayer = config.state.status === "in relayer"

  // Determine which step is required based on wallet state
  const requiredStep: OnboardingStep = !isConnected
    ? "SELECT_WALLET"
    : isWrongChain
      ? "SWITCH_NETWORK"
      : !isInRelayer
        ? "SIGN_MESSAGES"
        : "COMPLETION"

  const openOnboarding = (step?: OnboardingStep) => {
    setIsOpen(true, step ?? requiredStep)
  }

  return {
    isConnected,
    isWrongChain,
    isInRelayer,
    requiredStep,
    disconnect,
    openOnboarding,
  }
}
