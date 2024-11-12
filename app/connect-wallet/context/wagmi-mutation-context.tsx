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

  const { connect, status: connectionStatus } = useConnect({
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
        setError(error.message)
      },
    },
  })

  const { switchChain, status: switchChainStatus } = useSwitchChain({
    mutation: {
      onMutate: () => {
        setError(null)
        setStep("SWITCH_NETWORK")
      },
      onSuccess: () => {
        signMessage1({ message: `${ROOT_KEY_MESSAGE_PREFIX} ${chain.id}` })
      },
      onError: (error) => {
        setError(error.message)
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
        setError(error.message)
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
        // finally {
        //   resetSignMessage2()
        // }

        // Wallet does not exist, create or lookup

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
        setError(error.message)
      },
    },
  })

  // TODO: Must reset on close
  const resetSignMessages = () => {
    resetSignMessage1()
    resetSignMessage2()
  }

  const id = useId()

  const { mutate: createWalletMutation, status: createWalletStatus } =
    useMutation({
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
        setError(message)
      },
    })

  const { mutate: lookupWalletMutation, status: lookupWalletStatus } =
    useMutation({
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
        setError(message)
      },
    })

  const [lastConnector, setLastConnector] = useState<string | undefined>(
    undefined,
  )
  const [error, setError] = useState<string | null>(null)

  const value: WagmiMutationValue = {
    error,
    setError,
    lastConnector,
    setLastConnector,
    connectionStatus,
    switchChainStatus,
    signMessage1Status,
    signMessage2Status,
    createWalletStatus,
    lookupWalletStatus,
    connect,
    switchChain,
    signMessage1,
    signMessage2,
    resetSignMessages,
    isLoading:
      connectionStatus === "pending" ||
      switchChainStatus === "pending" ||
      signMessage1Status === "pending" ||
      signMessage2Status === "pending" ||
      createWalletStatus === "pending" ||
      lookupWalletStatus === "pending",
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
