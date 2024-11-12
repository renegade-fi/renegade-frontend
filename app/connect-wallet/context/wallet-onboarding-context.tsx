"use client"

import { ReactNode, createContext, useContext, useReducer } from "react"

import { useConfig, useStatus } from "@renegade-fi/react"
import { disconnect } from "@renegade-fi/react/actions"
import {
  useAccount,
  useChainId,
  useDisconnect,
  useConfig as useWagmiConfig,
} from "wagmi"

import { WagmiMutationProvider } from "@/app/connect-wallet/context/wagmi-mutation-context"
import {
  OnboardingContextValue,
  OnboardingState,
  OnboardingStep,
} from "@/app/connect-wallet/types"

import { chain } from "@/lib/viem"

const initialState: OnboardingState = {
  currentStep: "SELECT_WALLET",
  isOpen: false,
}

type Action =
  | { type: "SET_STEP"; payload: OnboardingStep }
  | {
      type: "SET_IS_OPEN"
      payload: { isOpen: boolean; step?: OnboardingStep }
    }
  | { type: "RESET" }
  | { type: "START_OVER" }

const WalletOnboardingContext = createContext<
  OnboardingContextValue | undefined
>(undefined)

function walletOnboardingReducer(
  state: OnboardingState,
  action: Action,
): OnboardingState {
  console.log("REDUCER", action)
  switch (action.type) {
    case "SET_STEP":
      return { ...state, currentStep: action.payload }
    case "SET_IS_OPEN":
      if (action.payload.isOpen) {
        // TODO: Reset mutation states
        return {
          ...initialState,
          isOpen: true,
          currentStep: action.payload.step ?? initialState.currentStep,
        }
      }
      return {
        ...state,
        isOpen: false,
      }
    case "RESET":
      return initialState
    case "START_OVER":
      return {
        ...initialState,
        isOpen: true,
      }
    default:
      return state
  }
}

export function WalletOnboardingProvider({
  children,
}: {
  children: ReactNode
}) {
  const [state, dispatch] = useReducer(walletOnboardingReducer, initialState)
  const config = useConfig()
  const wagmiConfig = useWagmiConfig()
  const { disconnect: disconnectWagmi } = useDisconnect()

  const { isConnected } = useAccount()
  const chainId = useChainId()
  const renegadeStatus = useStatus()
  const isInRelayer = renegadeStatus === "in relayer"
  const isWrongChain = chainId !== chain.id

  const requiredStep: OnboardingStep = !isConnected
    ? "SELECT_WALLET"
    : isWrongChain
      ? "SWITCH_NETWORK"
      : !isInRelayer
        ? "SIGN_MESSAGES"
        : "COMPLETION"

  const value: OnboardingContextValue = {
    ...state,
    setStep: (step: OnboardingStep) =>
      dispatch({ type: "SET_STEP", payload: step }),
    resetState: () => dispatch({ type: "RESET" }),
    startOver: async () => {
      dispatch({ type: "START_OVER" })
      try {
        disconnectWagmi()
      } catch {
        wagmiConfig.setState((state) => ({
          ...state,
          connections: new Map(),
        }))
      }
      disconnect(config)
    },
    setIsOpen: (open: boolean, step?: OnboardingStep) => {
      dispatch({ type: "SET_IS_OPEN", payload: { isOpen: open, step } })
    },
    isConnected,
    isWrongChain,
    isInRelayer,
    requiredStep,
  }

  return (
    <WalletOnboardingContext.Provider value={value}>
      <WagmiMutationProvider>{children}</WagmiMutationProvider>
    </WalletOnboardingContext.Provider>
  )
}

export function useWalletOnboarding(): OnboardingContextValue {
  const context = useContext(WalletOnboardingContext)
  if (!context) {
    throw new Error(
      "useWalletOnboarding must be used within a WalletOnboardingProvider",
    )
  }
  return context
}
