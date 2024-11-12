import { MutationStatus } from "@tanstack/react-query"
import { SignMessageErrorType, SwitchChainErrorType } from "viem"
import {
  UseConnectReturnType,
  UseSwitchChainReturnType,
  UseSignMessageReturnType,
} from "wagmi"

export type OnboardingStep =
  | "SELECT_WALLET"
  | "LOADING"
  | "SWITCH_NETWORK"
  | "SIGN_MESSAGES"
  | "PROCESSING"
  | "COMPLETION"

type ErrorType = SignMessageErrorType | SwitchChainErrorType
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
  isLoading: boolean
}

export interface WagmiMutationActions {
  connect: UseConnectReturnType["connect"]
  switchChain: UseSwitchChainReturnType["switchChain"]
  signMessage1: UseSignMessageReturnType["signMessage"]
  signMessage2: UseSignMessageReturnType["signMessage"]
  resetSignMessages: () => void
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
