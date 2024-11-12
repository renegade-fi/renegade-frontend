import React from "react"

import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { Connector, useConnect } from "wagmi"

import { useWagmiMutation } from "@/app/connect-wallet/context/wagmi-mutation-context"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

import { chain } from "@/lib/viem"

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
  if (!ready || connector.name === "Phantom") return null

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
        <span className="text-lg font-bold">{`${connector.name}${connector.id.includes("SDK") ? " (SDK)" : ""}`}</span>
      </div>
    </Button>
  )
}

export function SelectWalletPage() {
  const { connectors } = useConnect()
  const { setLastConnector, connect } = useWagmiMutation()

  const sortedConnectors = React.useMemo(() => {
    return [...connectors].sort((a, b) => {
      if (!!a.icon === !!b.icon) return 0
      if (a.icon && !b.icon) return -1
      return 1
    })
  }, [connectors])

  const handleConnect = async (connector: Connector) => {
    setLastConnector(connector.uid)
    connect({ connector, chainId: chain.id })
  }

  return (
    <>
      <DialogHeader className="p-6 px-6">
        <DialogTitle>Connect</DialogTitle>
        <VisuallyHidden>
          <DialogDescription>
            Select a wallet to connect to Renegade.
          </DialogDescription>
        </VisuallyHidden>
      </DialogHeader>

      <ScrollArea
        className="max-h-[calc(56vh)]"
        type="always"
      >
        <div className="flex flex-col gap-2 px-6 pb-6">
          {sortedConnectors.map((connector) => (
            <WalletOption
              key={connector.uid}
              connector={connector}
              onClick={() => handleConnect(connector)}
            />
          ))}
        </div>
      </ScrollArea>
    </>
  )
}
