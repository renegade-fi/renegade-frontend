import React from "react"

import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { useAccount, useSwitchChain } from "wagmi"

import { TokenIcon } from "@/components/token-icon"
import { Button } from "@/components/ui/button"
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { cn } from "@/lib/utils"
import { chain, getChainLogoTicker } from "@/lib/viem"

import { useWalletOnboarding } from "../../context/wallet-onboarding-context"

export function SwitchNetworkPage() {
  const { error, setError, setStep, startOver } = useWalletOnboarding()
  const { connector, chainId } = useAccount()

  const { switchChain, status: switchChainStatus } = useSwitchChain({
    mutation: {
      onError: (error) => {
        setError(error.message)
      },
      onSuccess: () => {
        setStep("SIGN_MESSAGES")
      },
    },
  })

  const nonce = React.useRef(0)
  React.useEffect(() => {
    if (!nonce.current) {
      nonce.current += 1
      switchChain({ chainId: chain.id })
    }
  }, [switchChain])

  React.useEffect(() => {}, [chainId, setStep])

  const handleSwitchNetwork = async () => {
    setError(null)
    switchChain({ chainId: chain.id })
  }

  const handleRetry = async () => {
    setError(null)
    switchChain({ chainId: chain.id })
  }

  const handleStartOver = () => {
    startOver()
  }

  const isPending = switchChainStatus === "pending"

  return (
    <>
      <DialogHeader className="px-6 pt-6">
        <DialogTitle>{"Switch Network"}</DialogTitle>
        <VisuallyHidden>
          <DialogDescription>
            Please switch to Arbitrum One to continue
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
          onClick={handleSwitchNetwork}
        >
          <TokenIcon
            size={64}
            ticker={getChainLogoTicker(chain.id)}
          />
        </Button>

        <div className="flex flex-col items-center gap-2">
          <h2 className="text-xl font-semibold">
            {error ? "Request Cancelled" : "Requesting Network Switch"}
          </h2>
          <p className="text-center text-sm text-muted-foreground">
            {error
              ? "You cancelled the request. Click above to try again."
              : `Open the ${connector?.name} browser extension to switch your network to ${chain.name}.`}
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
          Switch Network
        </Button>
      </DialogFooter>
    </>
  )
}
