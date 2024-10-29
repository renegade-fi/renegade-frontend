import { Wallet, useConnection, useWallet } from "@solana/wallet-adapter-react"

import { useWallets } from "@/app/hooks/use-solana-wallets"

import {
  useSolanaBalance,
  useSolanaChainBalance,
} from "@/components/dialogs/transfer/hooks/use-solana-balance"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function ConnectSolanaWallet() {
  const wallets = useWallets()
  const { select, disconnect, connected } = useWallet()

  const connect = async (wallet: Wallet) => {
    console.log("connecting", wallet.adapter.name)
    if (connected) {
      await disconnect()
    }
    select(wallet.adapter.name)
    // We use autoConnect on wallet selection
    // await solanaConnect();
    wallet.adapter.once("connect", (publicKey) => {
      console.log("connected", publicKey.toString())
    })
  }
  const { formatted: balance } = useSolanaChainBalance({ ticker: "USDC" })

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          {connected ? "Disconnect Solana Wallet" : "Connect Solana Wallet"}
          &nbsp;{balance && <span>{balance} USDC</span>}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect Solana Wallet</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {wallets?.map((wallet) => (
            <Button
              key={wallet.adapter.name}
              onClick={() => connect(wallet)}
            >
              {wallet.adapter.name}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
