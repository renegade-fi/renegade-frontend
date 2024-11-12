"use client"

import React, { ReactNode, createContext, useContext, useReducer } from "react"

import { useStatus } from "@renegade-fi/react"
import { useConfig } from "@renegade-fi/react"
import { disconnect } from "@renegade-fi/react/actions"
import {
  useAccount,
  useChainId,
  useDisconnect,
  useConfig as useWagmiConfig,
} from "wagmi"

import { chain } from "@/lib/viem"

import {
  OnboardingStep,
  WalletOnboardingContextType,
  WalletOnboardingHookReturn,
  WalletOnboardingState,
} from "../types"

const initialState: WalletOnboardingState = {
  currentStep: "SELECT_WALLET",
  error: null,
  lastConnector: undefined,
  isOpen: false,
}

type Action =
  | { type: "SET_STEP"; payload: OnboardingStep }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_LAST_CONNECTOR"; payload: string }
  | {
      type: "SET_IS_OPEN"
      payload: { isOpen: boolean; step?: OnboardingStep }
    }
  | { type: "RESET" }
  | { type: "START_OVER" }

const WalletOnboardingContext = createContext<
  WalletOnboardingContextType | undefined
>(undefined)

function walletOnboardingReducer(
  state: WalletOnboardingState,
  action: Action,
): WalletOnboardingState {
  switch (action.type) {
    case "SET_STEP":
      return { ...state, currentStep: action.payload }
    case "SET_ERROR":
      return { ...state, error: action.payload }
    case "SET_LAST_CONNECTOR":
      return { ...state, lastConnector: action.payload }
    case "SET_IS_OPEN":
      if (action.payload.isOpen) {
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
  const { disconnectAsync: disconnectWagmi } = useDisconnect()

  const value: WalletOnboardingContextType = {
    ...state,
    setStep: (step) => dispatch({ type: "SET_STEP", payload: step }),
    setError: (error) => dispatch({ type: "SET_ERROR", payload: error }),
    resetState: () => dispatch({ type: "RESET" }),
    startOver: async () => {
      dispatch({ type: "START_OVER" })
      try {
        await disconnectWagmi()
      } catch {
        wagmiConfig.setState((state) => ({
          ...state,
          connections: new Map(),
        }))
      }
      disconnect(config)
    },
    setLastConnector: (connectorId) =>
      dispatch({ type: "SET_LAST_CONNECTOR", payload: connectorId }),
    setIsOpen: (open: boolean, step?: OnboardingStep) => {
      dispatch({ type: "SET_IS_OPEN", payload: { isOpen: open, step } })
    },
  }

  return (
    <WalletOnboardingContext.Provider value={value}>
      {children}
    </WalletOnboardingContext.Provider>
  )
}

export function useWalletOnboarding(): WalletOnboardingHookReturn {
  const context = useContext(WalletOnboardingContext)
  if (!context) {
    throw new Error(
      "useWalletOnboarding must be used within a WalletOnboardingProvider",
    )
  }

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

  return {
    ...context,
    isConnected,
    isWrongChain,
    isInRelayer,
    requiredStep,
  }
}
