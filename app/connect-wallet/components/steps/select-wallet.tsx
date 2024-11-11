import * as React from "react"

import { Connector, useConnect, useAccount } from "wagmi"

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
    <button
      className="flex items-center justify-between rounded-lg border p-4 hover:bg-gray-50 disabled:opacity-50"
      disabled={!ready}
      onClick={onClick}
    >
      <span className="font-medium">{connector.name}</span>
    </button>
  )
}

export function SelectWalletPage() {
  const { setStep, setError, setLastConnector } = useWalletOnboarding()
  const { chainId, isConnected } = useAccount()
  const { connect, connectors } = useConnect({
    mutation: {
      onSuccess: () => {
        if (chainId === chain.id) {
          setStep("SIGN_MESSAGES")
        } else {
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
    <div className="flex flex-col gap-4">
      <div className="text-center">
        <h2 className="text-lg font-semibold">Connect Your Wallet</h2>
        <p className="text-sm text-gray-500">
          Select a wallet to connect to this application
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {connectors.map((connector) => (
          <WalletOption
            key={connector.uid}
            connector={connector}
            onClick={() => handleConnect(connector)}
          />
        ))}
      </div>
    </div>
  )
}
