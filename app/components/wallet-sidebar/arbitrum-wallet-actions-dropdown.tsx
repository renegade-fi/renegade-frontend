import { Clipboard, ExternalLink, SquareX } from "lucide-react"
import { useDisconnect } from "wagmi"

import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

import { useChain } from "@/hooks/use-chain"
import type { Wallet } from "@/hooks/use-wallets"

interface ArbitrumWalletActionsDropdownProps {
  wallet: Wallet
}

export function ArbitrumWalletActionsDropdown({
  wallet,
}: ArbitrumWalletActionsDropdownProps) {
  const chain = useChain()
  const { disconnect } = useDisconnect()

  const handleCopyAddress = () => {
    if (wallet.isConnected) {
      navigator.clipboard.writeText(wallet.id)
    }
  }

  const handleViewExplorer = () => {
    if (wallet.isConnected) {
      const explorerUrl = `${chain?.blockExplorers?.default?.url}/address/${wallet.id}`
      window.open(explorerUrl, "_blank")
    }
  }

  const handleDisconnect = () => {
    disconnect()
    // Allow sync to disconnect Renegade wallet
  }

  return (
    <>
      <DropdownMenuLabel className="break-words text-xs font-normal">
        {wallet.id}
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuItem
          disabled={!wallet.isConnected}
          onSelect={handleCopyAddress}
        >
          <Clipboard />
          Copy Address
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={!wallet.isConnected}
          onSelect={handleViewExplorer}
        >
          <ExternalLink />
          View on Explorer
        </DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuItem
          disabled={!wallet.isConnected}
          onSelect={handleDisconnect}
        >
          <SquareX />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuGroup>
    </>
  )
}
