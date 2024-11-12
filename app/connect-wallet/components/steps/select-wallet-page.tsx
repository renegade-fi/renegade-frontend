import React from "react"

import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { Connector, useAccount, useConnect, useSwitchChain } from "wagmi"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { chain } from "@/lib/viem"

import { useWalletOnboarding } from "../../context/wallet-onboarding-context"

function WalletOption({
  connector,
  onClick,
}: {
  connector: Connector
  onClick: () => void
}) {
  const [ready, setReady] = React.useState(false)

  React.useEffect(() => {
    ;(async () => {
      const provider = await connector.getProvider()
      setReady(!!provider)
    })()
  }, [connector])

  return (
    <Button
      className="h-20 justify-normal"
      disabled={!ready}
      variant="outline"
      onClick={onClick}
    >
      <div className="flex-start flex items-center gap-3">
        <Avatar className="rounded-lg">
          {connector.icon && (
            <AvatarImage
              alt={`${connector.name} icon`}
              src={connector.icon}
            />
          )}
          <AvatarFallback className="rounded-lg">
            {connector.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <span className="text-lg font-bold">{connector.name}</span>
      </div>
    </Button>
  )
}

export function SelectWalletPage() {
  const { setStep, setError, setLastConnector } = useWalletOnboarding()
  const { switchChain } = useSwitchChain({
    mutation: {
      onError: (error) => {
        setError(error.message)
      },
      onSuccess: () => {
        setStep("SIGN_MESSAGES")
      },
    },
  })
  const { connect, connectors, status } = useConnect({
    mutation: {
      onSuccess: (data) => {
        console.log("🚀 ~ LoadingPage ~ data:", data)
        if (data.chainId === chain.id) {
          setStep("SIGN_MESSAGES")
        } else {
          switchChain({ chainId: chain.id })
          setStep("SWITCH_NETWORK")
        }
      },
      onError: (error) => {
        setError(error.message)
      },
    },
  })

  const handleConnect = async (connector: Connector) => {
    try {
      setError(null)
      setLastConnector(connector.uid)
      setStep("LOADING")
      connect({ connector })
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <>
      <DialogHeader className="px-6 pt-6">
        <DialogTitle>Connect</DialogTitle>
        <VisuallyHidden>
          <DialogDescription>
            Select a wallet to connect to Renegade.
          </DialogDescription>
        </VisuallyHidden>
      </DialogHeader>

      <div className="flex flex-col gap-2 p-6">
        {connectors.map((connector) => (
          <WalletOption
            key={connector.uid}
            connector={connector}
            onClick={() => handleConnect(connector)}
          />
        ))}
      </div>
    </>
  )
}
