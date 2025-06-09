"use client"

import { useEffect, useId } from "react"

import { ConfigRequiredError, useConfig } from "@renegade-fi/react"
import {
  createWallet,
  getWalletFromRelayer,
  lookupWallet,
} from "@renegade-fi/react/actions"
import { useMutation } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import {
  useCurrentChain,
  useCurrentWallet,
} from "@/providers/state-provider/hooks"

// Toast messages
const MSG_INITIAL = "Setting up your wallet..."
const MSG_CREATING = "Creating your wallet..."
const MSG_RECOVER = "Recovering your wallet..."
const MSG_SUCCESS = "All set! Your wallet is ready"
const MSG_ERROR = "Oops, something went wrong"

// Polling constants
const POLL_DELAY_MS = 2000
const POLL_TIMEOUT_MS = 60000

export function WalletIndexCheck() {
  const { seed, id } = useCurrentWallet()
  const chainId = useCurrentChain()
  const config = useConfig()
  const toastId = useId()

  async function delay(ms: number) {
    return new Promise<void>((resolve) => setTimeout(resolve, ms))
  }

  async function indexWallet() {
    if (!config) throw new ConfigRequiredError("indexWallet")

    try {
      // Step 1: Check if wallet already exists
      try {
        const existing = await getWalletFromRelayer(config)
        if (existing.id) {
          return existing
        }
      } catch (error) {
        // No existing wallet found, continue to creation/lookup flow
        console.log("No existing wallet found, will create or lookup")
      }

      toast(MSG_INITIAL, {
        duration: Infinity,
        id: toastId,
        icon: <Loader2 className="h-4 w-4 animate-spin text-black" />,
      })

      // Fetch logs to determine if wallet should be created or recovered
      const blinderShare = config.utils.derive_blinder_share(seed!)
      const res = await fetch(
        `/api/get-logs?blinderShare=${blinderShare}&chainId=${chainId}`,
      )
      if (!res.ok) throw new Error("Failed to fetch logs")
      const { logs } = await res.json()

      // Create or lookup wallet based on logs
      if (logs === 0) {
        toast(MSG_CREATING, {
          id: toastId,
          icon: <Loader2 className="h-4 w-4 animate-spin text-black" />,
        })
        await createWallet(config)
      } else {
        toast(MSG_RECOVER, {
          id: toastId,
          icon: <Loader2 className="h-4 w-4 animate-spin text-black" />,
        })
        await lookupWallet(config)
      }

      // Poll for wallet to be indexed
      let polled
      const startTime = Date.now()
      do {
        await delay(POLL_DELAY_MS)
        polled = await getWalletFromRelayer(config)
        if (Date.now() - startTime > POLL_TIMEOUT_MS) {
          throw new Error("Wallet indexing timed out after 60 seconds")
        }
      } while (!polled.id)

      toast.success(MSG_SUCCESS, {
        id: toastId,
        duration: 2000,
        icon: undefined,
      })
      return polled
    } catch (error) {
      toast.error(MSG_ERROR, { id: toastId, duration: 2000, icon: undefined })
      throw error
    }
  }

  const { mutate } = useMutation({
    mutationFn: indexWallet,
  })

  useEffect(() => {
    if (config && seed && chainId && id) {
      mutate()
    }
  }, [chainId, config, mutate, seed, id])

  return null
}
