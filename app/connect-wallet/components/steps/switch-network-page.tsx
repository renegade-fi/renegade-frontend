import React from "react"

import { useAccount, useSwitchChain } from "wagmi"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { chain } from "@/lib/viem"

import { useWalletOnboarding } from "../../context/wallet-onboarding-context"

export function SwitchNetworkPage() {
  const { setStep, setError } = useWalletOnboarding()
  const { address, chainId } = useAccount()
  const [isLoading, setIsLoading] = React.useState(false)

  const { switchChainAsync } = useSwitchChain({
    mutation: {
      onError: (error) => {
        setError(error.message)
      },
      onSuccess: () => {
        setStep("SIGN_MESSAGES")
      },
    },
  })

  const handleSwitchNetwork = async () => {
    try {
      setIsLoading(true)
      if (chainId === chain.id) {
        setStep("SIGN_MESSAGES")
        return
      }
      await switchChainAsync({ chainId: chain.id })
    } catch (error) {
      // Error will be handled by the mutation onError callback
    } finally {
      setIsLoading(false)
    }
  }

  // Initial check when component mounts
  React.useEffect(() => {
    handleSwitchNetwork()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!address) {
    return null
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Switch Network</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Please switch to Ethereum Mainnet to continue
          </p>
          <Button
            disabled={isLoading}
            onClick={handleSwitchNetwork}
          >
            {isLoading ? "Switching..." : "Switch to Mainnet"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
