import { Clipboard, ExternalLink } from "lucide-react"

import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

import type { Wallet } from "@/hooks/use-wallets"
import { chain } from "@/lib/viem"

interface ArbitrumWalletActionsDropdownProps {
  wallet: Wallet
}

export function ArbitrumWalletActionsDropdown({
  wallet,
}: ArbitrumWalletActionsDropdownProps) {
  const handleCopyAddress = () => {
    if (wallet.isConnected) {
      navigator.clipboard.writeText(wallet.id)
    }
  }

  const handleViewExplorer = () => {
    if (wallet.isConnected) {
      const explorerUrl = `${chain.blockExplorers.default.url}/address/${wallet.id}`
      window.open(explorerUrl, "_blank")
    }
  }

  return (
    <>
      <DropdownMenuLabel className="break-words text-xs font-normal">
        {wallet.label}
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
    </>
  )
}
