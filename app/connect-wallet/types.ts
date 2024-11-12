export type OnboardingStep =
  | "SELECT_WALLET"
  | "LOADING"
  | "SWITCH_NETWORK"
  | "SIGN_MESSAGES"
  | "PROCESSING"
  | "COMPLETION"

export interface WalletOnboardingState {
  currentStep: OnboardingStep
  error: string | null
  lastConnector?: string
  isOpen: boolean
  initialStep?: OnboardingStep
}

export interface WalletOnboardingContextType extends WalletOnboardingState {
  setStep: (step: OnboardingStep) => void
  setError: (error: string | null) => void
  resetState: () => void
  startOver: () => Promise<void>
  setLastConnector: (connectorId: string) => void
  setIsOpen: (open: boolean, initialStep?: OnboardingStep) => void
}

export interface WalletOnboardingHookReturn
  extends WalletOnboardingContextType {
  isConnected: boolean
  isWrongChain: boolean
  isInRelayer: boolean
  requiredStep: OnboardingStep
}
