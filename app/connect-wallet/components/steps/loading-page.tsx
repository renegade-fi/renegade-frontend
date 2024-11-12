import React from "react"

import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { useConnect, useSwitchChain } from "wagmi"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { cn } from "@/lib/utils"
import { chain } from "@/lib/viem"

import { useWalletOnboarding } from "../../context/wallet-onboarding-context"

export function LoadingPage() {
  const { error, setError, setStep, lastConnector } = useWalletOnboarding()

  const {
    connectors,
    connect,
    status: connectionStatus,
  } = useConnect({
    mutation: {
      onSuccess: (data) => {
        if (data.chainId === chain.id) {
          setStep("SIGN_MESSAGES")
        } else {
          // switchChain({ chainId: chain.id })
          setStep("SWITCH_NETWORK")
        }
      },
      onError: (error) => {
        setError(error.message)
      },
    },
  })

  const connector = React.useMemo(
    () => connectors.find((c) => c.uid === lastConnector),
    [connectors, lastConnector],
  )

  const nonce = React.useRef(0)
  React.useEffect(() => {
    if (!connector) return
    if (!nonce.current) {
      nonce.current += 1
      connect({ connector })
    }
  }, [connect, connector])

  const handleRetry = async () => {
    if (!lastConnector || !connector) return
    setError(null)
    connect({ connector })
  }

  const isPending = connectionStatus === "pending"

  return (
    <>
      <DialogHeader className="px-6 pt-6">
        <DialogTitle>{connector?.name || "Requesting Connection"}</DialogTitle>
        <VisuallyHidden>
          <DialogDescription>
            Select a wallet to connect to Renegade.
          </DialogDescription>
        </VisuallyHidden>
      </DialogHeader>

      <div className="flex flex-col items-center justify-center gap-2 p-8">
        <Button
          className={cn(
            "aspect-square h-24",
            isPending && "pointer-events-none",
          )}
          variant="ghost"
          onClick={handleRetry}
        >
          <Avatar
            className={cn("h-16 w-16 rounded-lg", isPending && "animate-pulse")}
          >
            {connector?.icon && (
              <AvatarImage
                alt={`${connector.name} icon`}
                src={connector.icon}
              />
            )}
            <AvatarFallback className="rounded-lg">
              {connector?.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
        </Button>

        <div className="flex flex-col items-center gap-2">
          <h2 className="text-xl font-semibold">
            {error ? "Request Cancelled" : "Requesting Connection"}
          </h2>
          <p className="text-center text-sm text-muted-foreground">
            {error
              ? "You cancelled the request."
              : `Open the ${connector?.name} browser extension to connect your wallet.`}
          </p>
        </div>
      </div>
      <DialogFooter className={cn(isPending && "hidden")}>
        <Button
          className="flex-1 border-x-0 border-b-0 border-t font-extended text-2xl"
          size="xl"
          variant="outline"
          onClick={handleRetry}
        >
          Try again
        </Button>
      </DialogFooter>
    </>
  )
}
