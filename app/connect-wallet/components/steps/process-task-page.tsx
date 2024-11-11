import React from "react"

import { useConfig } from "@renegade-fi/react"
import { createWallet, lookupWallet } from "@renegade-fi/react/actions"
import { useMutation, useQuery } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { DialogHeader, DialogTitle } from "@/components/ui/dialog"

import {
  CREATE_WALLET_START,
  CREATE_WALLET_SUCCESS,
  LOOKUP_WALLET_START,
  LOOKUP_WALLET_SUCCESS,
} from "@/lib/constants/toast"

import { useWalletOnboarding } from "../../context/wallet-onboarding-context"

export function ProcessingPage() {
  const { setStep, setError } = useWalletOnboarding()
  const config = useConfig()
  const hasMutationRun = React.useRef(false)

  // Query to fetch the number of logs
  const { data: logsCount } = useQuery({
    queryKey: ["wallet-logs"],
    queryFn: async () => {
      const blinderShare = config.utils.derive_blinder_share(config.state.seed)
      const res = await fetch(`/api/get-logs?blinderShare=${blinderShare}`)
      if (!res.ok) throw new Error("Failed to query chain")
      const { logs } = await res.json()
      return logs as number
    },
  })

  // Mutation for creating a new wallet
  const { mutate: createNewWallet } = useMutation({
    mutationFn: () => createWallet(config),
    onMutate: () => {
      toast.loading(CREATE_WALLET_START)
    },
    onSuccess: () => {
      toast.success(CREATE_WALLET_SUCCESS)
      setStep("COMPLETION")
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Failed to create wallet"
      toast.error(message)
      setError(message)
    },
    onSettled: () => {
      toast.dismiss()
    },
  })

  // Mutation for looking up existing wallet
  const { mutate: lookupExistingWallet } = useMutation({
    mutationFn: () => lookupWallet(config),
    onMutate: () => {
      toast.loading(LOOKUP_WALLET_START)
    },
    onSuccess: () => {
      toast.success(LOOKUP_WALLET_SUCCESS)
      setStep("COMPLETION")
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Failed to lookup wallet"
      toast.error(message)
      setError(message)
    },
    onSettled: () => {
      toast.dismiss()
    },
  })

  // Effect to handle wallet creation/lookup once logs are fetched
  React.useEffect(() => {
    if (typeof logsCount === "number" && !hasMutationRun.current) {
      hasMutationRun.current = true

      if (logsCount === 0) {
        createNewWallet()
      } else if (logsCount > 0) {
        lookupExistingWallet()
      }
    }
  }, [logsCount, createNewWallet, lookupExistingWallet])

  return (
    <>
      <DialogHeader className="px-6 pt-6">
        <DialogTitle>Setting up your wallet</DialogTitle>
      </DialogHeader>
      <div className="flex flex-col items-center justify-center gap-4 py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm text-muted-foreground">
          Please wait while we set up your wallet...
        </p>
      </div>
    </>
  )
}
