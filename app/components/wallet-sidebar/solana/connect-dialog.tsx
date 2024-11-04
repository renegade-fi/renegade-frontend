import { Wallet, useWallet } from "@solana/wallet-adapter-react"
import { useMutation } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"

import { useWallets } from "@/app/hooks/use-solana-wallets"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function SolanaConnectDialog() {
  const wallets = useWallets()
  const { select } = useWallet()

  const connectMutation = useMutation({
    mutationFn: async (wallet: Wallet) => {
      select(wallet.adapter.name)
      return new Promise<string>((resolve, reject) => {
        wallet.adapter.once("connect", (publicKey) => {
          resolve(publicKey.toString())
        })
        wallet.adapter.once("error", (error) => {
          reject(error)
        })
        setTimeout(() => reject(new Error("Connection timeout")), 30000)
      })
    },
    onSuccess: (publicKey) => {
      console.log("Connected successfully:", publicKey)
    },
    onError: (error) => {
      console.error("Failed to connect:", error)
    },
  })

  if (connectMutation.isPending) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="relative">
          <Avatar className="h-24 w-24">
            {connectMutation.variables?.adapter.icon && (
              <AvatarImage
                alt={`${connectMutation.variables.adapter.name} icon`}
                className="animate-pulse"
                src={connectMutation.variables.adapter.icon}
              />
            )}
            <AvatarFallback className="text-2xl">
              {connectMutation.variables?.adapter.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-2 -right-2 rounded-full bg-background p-1">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          Connecting to {connectMutation.variables?.adapter.name}...
        </p>
      </div>
    )
  }

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle className="text-xl font-semibold">
          Bridge USDC from Solana
        </DialogTitle>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Connect a Solana wallet to bridge USDC to your Arbitrum wallet,
            which can then be deposited into Renegade.
          </p>
          <p className="text-xs italic text-muted-foreground/75">
            Note: This Solana wallet can only be used for bridging funds. It
            cannot directly interact with the Renegade protocol.
          </p>
        </div>
      </DialogHeader>
      <div className="grid gap-3 py-4">
        {wallets?.map((wallet) => (
          <Button
            key={wallet.adapter.name}
            className="flex w-full justify-between px-5 py-8 text-base font-normal"
            disabled={connectMutation.isPending}
            variant="outline"
            onClick={() => connectMutation.mutate(wallet)}
          >
            <span className="font-extended font-bold">
              {wallet.adapter.name}
            </span>
            <Avatar className="h-8 w-8">
              {wallet.adapter.icon && (
                <AvatarImage
                  alt={`${wallet.adapter.name} icon`}
                  src={wallet.adapter.icon}
                />
              )}
              <AvatarFallback>{wallet.adapter.name.charAt(0)}</AvatarFallback>
            </Avatar>
          </Button>
        ))}
      </div>
    </DialogContent>
  )
}
