"use client"

import { ReactNode, createContext, useContext, useId, useState } from "react"

import { useConfig } from "@renegade-fi/react"
import {
  createWallet,
  getWalletId,
  lookupWallet,
} from "@renegade-fi/react/actions"
import { getWalletFromRelayer } from "@renegade-fi/react/actions"
import { ROOT_KEY_MESSAGE_PREFIX } from "@renegade-fi/react/constants"
import { useMutation, useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { BaseError } from "viem"
import { useConnect, useSignMessage, useSwitchChain } from "wagmi"

import { useWalletOnboarding } from "@/app/connect-wallet/context/wallet-onboarding-context"

import {
  CREATE_WALLET_START,
  CREATE_WALLET_SUCCESS,
  LOOKUP_WALLET_START,
  LOOKUP_WALLET_SUCCESS,
} from "@/lib/constants/toast"
import { chain } from "@/lib/viem"

import { WagmiMutationValue } from "../types"

const WagmiMutation = createContext<WagmiMutationValue | undefined>(undefined)

interface WagmiMutationProviderProps {
  children: ReactNode
}

export function WagmiMutationProvider({
  children,
}: WagmiMutationProviderProps) {
  const { setStep, setIsOpen } = useWalletOnboarding()
  const config = useConfig()

  const {
    connect,
    status: connectionStatus,
    reset: resetConnect,
  } = useConnect({
    mutation: {
      onMutate: () => {
        setError(null)
        setStep("LOADING")
      },
      onSuccess: (data) => {
        console.log("CONNECT SUCCESS", data)

        if (data.chainId === chain.id) {
          signMessage1({ message: `${ROOT_KEY_MESSAGE_PREFIX} ${chain.id}` })
        } else {
          switchChain({ chainId: chain.id })
        }
      },
      onError: (error) => {
        setError((error as BaseError).shortMessage ?? error.message)
      },
    },
  })

  const {
    switchChain,
    status: switchChainStatus,
    reset: resetSwitchChain,
  } = useSwitchChain({
    mutation: {
      onMutate: () => {
        setError(null)
        setStep("SWITCH_NETWORK")
      },
      onSuccess: () => {
        signMessage1({ message: `${ROOT_KEY_MESSAGE_PREFIX} ${chain.id}` })
      },
      onError: (error) => {
        setError((error as BaseError).shortMessage ?? error.message)
      },
    },
  })

  const {
    signMessage: signMessage1,
    status: signMessage1Status,
    reset: resetSignMessage1,
    data: signMessage1Data,
  } = useSignMessage({
    mutation: {
      onMutate: () => {
        setError(null)
        setStep("SIGN_MESSAGES")
      },
      onSuccess() {
        signMessage2({
          message: `${ROOT_KEY_MESSAGE_PREFIX} ${chain.id}`,
        })
      },
      onError: (error) => {
        setError((error as BaseError).shortMessage ?? error.message)
      },
    },
  })

  const {
    signMessage: signMessage2,
    status: signMessage2Status,
    reset: resetSignMessage2,
  } = useSignMessage({
    mutation: {
      onMutate: () => {
        setError(null)
      },
      async onSuccess(data) {
        if (!data || !signMessage1Data) {
          setError("Missing signature")
          return
        }
        if (data !== signMessage1Data) {
          setError(
            "Signatures do not match. Please try again with a different wallet.",
          )
          return
        }
        const seed = data
        config.setState((x) => ({ ...x, seed }))
        const id = getWalletId(config)
        config.setState((x) => ({ ...x, id }))

        // Check if wallet exists in relayer
        try {
          const wallet = await getWalletFromRelayer(config)
          if (wallet) {
            // Wallet exists, complete
            config.setState((x) => ({ ...x, status: "in relayer" }))
            setIsOpen(false)
            return
          }
        } catch (error) {}

        const blinderShare = config.utils.derive_blinder_share(seed)
        const res = await fetch(`/api/get-logs?blinderShare=${blinderShare}`)
        if (!res.ok) throw new Error("Failed to query chain")
        const { logs } = await res.json()
        // Iff logs === 0, create wallet
        if (logs === 0) {
          createWalletMutation()
        } else if (logs > 0) {
          lookupWalletMutation()
        }
      },
      onError: (error) => {
        setError((error as BaseError).shortMessage ?? error.message)
      },
    },
  })

  // TODO: Must reset on close
  const resetMutations = () => {
    resetConnect()
    resetSwitchChain()
    resetSignMessage1()
    resetSignMessage2()
    resetCreateWallet()
    resetLookupWallet()
  }

  const id = useId()

  const {
    mutate: createWalletMutation,
    status: createWalletStatus,
    reset: resetCreateWallet,
  } = useMutation({
    mutationFn: () => createWallet(config),
    onMutate() {
      setError(null)
      toast.loading(CREATE_WALLET_START, { id })
      setStep("PROCESSING")
    },
    onSuccess() {
      toast.success(CREATE_WALLET_SUCCESS, { id })
      setIsOpen(false)
    },
    onError(error) {
      const message =
        error instanceof Error ? error.message : "Failed to create wallet"
      toast.error(message, { id })
      setError((error as BaseError).shortMessage ?? error.message)
    },
  })

  const {
    mutate: lookupWalletMutation,
    status: lookupWalletStatus,
    reset: resetLookupWallet,
  } = useMutation({
    mutationFn: () => lookupWallet(config),
    onMutate() {
      setError(null)
      toast.loading(LOOKUP_WALLET_START, { id })
      setStep("PROCESSING")
    },
    onSuccess() {
      toast.success(LOOKUP_WALLET_SUCCESS, { id })
      setIsOpen(false)
    },
    onError(error) {
      const message =
        error instanceof Error ? error.message : "Failed to lookup wallet"
      toast.error(message, { id })
      setError((error as BaseError).shortMessage ?? error.message)
    },
  })

  const [lastConnector, setLastConnector] = useState<string | undefined>(
    undefined,
  )
  const [error, setError] = useState<string | null>(null)
  console.log("🚀 ~ error:", error)

  const value: WagmiMutationValue = {
    connect,
    connectionStatus,
    createWalletStatus,
    error,
    lastConnector,
    lookupWalletStatus,
    resetMutations,
    setError,
    setLastConnector,
    signMessage1,
    signMessage1Status,
    signMessage2,
    signMessage2Status,
    switchChain,
    switchChainStatus,
  }

  return (
    <WagmiMutation.Provider value={value}>{children}</WagmiMutation.Provider>
  )
}

export function useWagmiMutation(): WagmiMutationValue {
  const context = useContext(WagmiMutation)
  if (!context) {
    throw new Error(
      "useWagmiMutation must be used within a WagmiMutationProvider",
    )
  }
  return context
}
