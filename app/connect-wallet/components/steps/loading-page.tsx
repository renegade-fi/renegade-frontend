import React from "react"

import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { useConnect } from "wagmi"

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

import { useWagmiMutation } from "../../context/wagmi-mutation-context"

export function LoadingPage() {
  const { connect, error, connectionStatus, lastConnector } = useWagmiMutation()

  const { connectors } = useConnect()

  const connector = React.useMemo(
    () => connectors.find((c) => c.uid === lastConnector),
    [connectors, lastConnector],
  )

  const handleRetry = async () => {
    if (!connector) return
    connect({ connector, chainId: chain.id })
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

      <div className="flex flex-col items-center justify-center gap-8 p-8">
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
      <DialogFooter>
        <Button
          className="flex-1 border-x-0 border-b-0 border-t font-extended text-2xl"
          disabled={isPending}
          size="xl"
          variant="outline"
          onClick={handleRetry}
        >
          Connect Wallet
        </Button>
      </DialogFooter>
    </>
  )
}
