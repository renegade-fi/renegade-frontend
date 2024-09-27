import React, { useId } from "react"

import { useConfig } from "@renegade-fi/react"
import {
  createWallet,
  getWalletFromRelayer,
  getWalletId,
  lookupWallet,
} from "@renegade-fi/react/actions"
import { ROOT_KEY_MESSAGE_PREFIX } from "@renegade-fi/react/constants"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useLocalStorage } from "usehooks-ts"
import { BaseError } from "viem"
import { useSignMessage } from "wagmi"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { useMediaQuery } from "@/hooks/use-media-query"
import { STORAGE_REMEMBER_ME } from "@/lib/constants/storage"
import {
  CREATE_WALLET_ERROR,
  CREATE_WALLET_START,
  CREATE_WALLET_SUCCESS,
  LOOKUP_WALLET_ERROR,
  LOOKUP_WALLET_START,
  LOOKUP_WALLET_SUCCESS,
} from "@/lib/constants/toast"
import { chain } from "@/lib/viem"

export function SignInDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const {
    signMessage,
    status: signStatus,
    isSuccess: signSuccess,
  } = useSignMessage()
  const config = useConfig()
  const [isConnecting, setIsConnecting] = React.useState(false)
  const toastId = useId()

  const handleClick = () =>
    signMessage(
      {
        message: `${ROOT_KEY_MESSAGE_PREFIX} ${chain.id}`,
      },
      {
        async onSuccess(data) {
          toast.success("Processing request...", {
            id: toastId,
            icon: <Loader2 className="h-4 w-4 animate-spin text-black" />,
          })
          config.setState((x) => ({ ...x, seed: data }))
          const id = getWalletId(config)
          config.setState((x) => ({ ...x, id }))
          setIsConnecting(true)
          try {
            // GET wallet from relayer
            const wallet = await getWalletFromRelayer(config)
            // If success, return
            if (wallet) {
              config.setState((x) => ({ ...x, status: "in relayer" }))
              toast.success("Successfully signed in", {
                id: toastId,
                icon: undefined,
              })
              onOpenChange(false)
              setIsConnecting(false)
              return
            }
          } catch (error) {}

          // GET # logs
          const blinderShare = config.utils.derive_blinder_share(data)
          const res = await fetch(`/api/get-logs?blinderShare=${blinderShare}`)

          if (!res.ok) {
            toast.error("Failed to query chain, please try again.")
            setIsConnecting(false)
          }
          const { logs } = await res.json()
          if (logs === 0) {
            // Iff logs === 0, create wallet
            toast.promise(
              createWallet(config)
                .then(() => {
                  onOpenChange(false)
                })
                .finally(() => {
                  setIsConnecting(false)
                }),
              {
                id: toastId,
                loading: CREATE_WALLET_START,
                success: CREATE_WALLET_SUCCESS,
                error: (error) => {
                  console.error(error)
                  return CREATE_WALLET_ERROR
                },
                icon: undefined,
              },
            )
          } else if (logs > 0) {
            // Iff logs > 0, lookup wallet
            toast.promise(
              lookupWallet(config)
                .then(() => {
                  onOpenChange(false)
                })
                .finally(() => {
                  setIsConnecting(false)
                }),
              {
                id: toastId,
                loading: LOOKUP_WALLET_START,
                success: LOOKUP_WALLET_SUCCESS,
                error: LOOKUP_WALLET_ERROR,
                icon: undefined,
              },
            )
          }
        },
        onError(error) {
          console.error(error)
          toast.error(
            `Error signing message: ${(error as BaseError).shortMessage || error.message}`,
            {
              id: toastId,
              icon: undefined,
            },
          )
        },
      },
    )
  const isDesktop = useMediaQuery("(min-width: 1024px)")

  if (isDesktop) {
    return (
      <Dialog
        open={open}
        onOpenChange={onOpenChange}
      >
        <DialogContent className="gap-0 p-0 sm:max-w-[425px]">
          <DialogHeader className="p-6">
            <DialogTitle className="font-extended">
              Unlock your Wallet
            </DialogTitle>
            <DialogDescription>
              To trade on Renegade, we require a one-time signature to create or
              find your wallet on-chain.
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 pt-0">
            <SignInContent />
          </div>
          <DialogFooter>
            <Button
              className="flex-1 border-x-0 border-b-0 border-t font-extended text-2xl"
              disabled={isConnecting || signStatus === "pending"}
              size="xl"
              variant="outline"
              onClick={handleClick}
            >
              {signStatus === "pending" || isConnecting
                ? "Confirm in wallet"
                : "Sign in to Renegade"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="h-dvh gap-0">
        <DialogHeader className="text-left">
          <DialogTitle>Unlock your Wallet</DialogTitle>
          <DialogDescription>
            To trade on Renegade, we require a one-time signature to create or
            find your wallet on-chain.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            className="font-extended text-lg"
            disabled={isConnecting || signStatus === "pending"}
            size="xl"
            onClick={handleClick}
          >
            {signStatus === "pending" || isConnecting
              ? "Confirm in wallet"
              : "Sign in to Renegade"}
          </Button>
          <div className="mb-6">
            <SignInContent />
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function SignInContent() {
  const [rememberMe, setRememberMe] = useLocalStorage(
    STORAGE_REMEMBER_ME,
    false,
    {
      initializeWithValue: false,
    },
  )
  return (
    <>
      <div className="flex items-center space-x-2">
        <Checkbox
          checked={rememberMe}
          id="remember-me"
          onCheckedChange={(checked) => {
            if (typeof checked === "boolean") {
              setRememberMe(checked)
            }
          }}
        />
        <label
          className="text-sm font-medium leading-none text-muted-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          htmlFor="remember-me"
        >
          Remember me
        </label>
      </div>
    </>
  )
}
