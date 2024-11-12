import { MutationStatus } from "@tanstack/react-query"
import {
  UseConnectReturnType,
  UseSignMessageReturnType,
  UseSwitchChainReturnType,
} from "wagmi"

export type OnboardingStep =
  | "SELECT_WALLET"
  | "LOADING"
  | "SWITCH_NETWORK"
  | "SIGN_MESSAGES"
  | "PROCESSING"
  | "COMPLETION"

// Wallet Connection (Wagmi Mutations) Types
export interface WagmiMutationState {
  setError: (error: string | null) => void
  error: string | null
  lastConnector?: string
  connectionStatus: MutationStatus
  switchChainStatus: MutationStatus
  signMessage1Status: MutationStatus
  signMessage2Status: MutationStatus
  createWalletStatus: MutationStatus
  lookupWalletStatus: MutationStatus
}

export interface WagmiMutationActions {
  connect: UseConnectReturnType["connect"]
  switchChain: UseSwitchChainReturnType["switchChain"]
  signMessage1: UseSignMessageReturnType["signMessage"]
  signMessage2: UseSignMessageReturnType["signMessage"]
  resetMutations: () => void
  setLastConnector: (connectorId: string) => void
}

export type WagmiMutationValue = WagmiMutationState & WagmiMutationActions

// Onboarding Flow (Steps/UI) Types
export interface OnboardingState {
  currentStep: OnboardingStep
  isOpen: boolean
  initialStep?: OnboardingStep
}

export interface OnboardingActions {
  setStep: (step: OnboardingStep) => void
  resetState: () => void
  startOver: () => Promise<void>
  setIsOpen: (open: boolean, initialStep?: OnboardingStep) => void
}

export interface OnboardingStatus {
  isConnected: boolean
  isWrongChain: boolean
  isInRelayer: boolean
  requiredStep: OnboardingStep
}

export type OnboardingContextValue = OnboardingState &
  OnboardingActions &
  OnboardingStatus

export type ProcessingType = "create" | "lookup" | null
