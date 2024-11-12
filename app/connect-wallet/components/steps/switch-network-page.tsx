import React from "react"

import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { RotateCw } from "lucide-react"
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
  const { error, setError, setStep, lastConnector, startOver } =
    useWalletOnboarding()
  const { connector, chainId } = useAccount()

  const { switchChain, status } = useSwitchChain({
    mutation: {
      onError: (error) => {
        setError(error.message)
      },
      onSuccess: () => {
        setStep("SIGN_MESSAGES")
      },
    },
  })

  React.useEffect(() => {
    if (chainId === chain.id) {
      setStep("SIGN_MESSAGES")
    }
  }, [chainId, setStep])

  const handleSwitchNetwork = async () => {
    setError(null)
    switchChain({ chainId: chain.id })
  }

  const handleStartOver = () => {
    startOver()
  }

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
            status === "pending" && "pointer-events-none",
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
      <DialogFooter className="pb-4 sm:justify-center">
        <Button
          className=""
          variant="ghost"
          onClick={handleStartOver}
        >
          <RotateCw className="mr-2 size-4" /> Start Over
        </Button>
      </DialogFooter>
    </>
  )
}
