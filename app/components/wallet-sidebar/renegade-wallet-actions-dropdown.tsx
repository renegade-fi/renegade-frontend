import { refreshWallet } from "@renegade-fi/react/actions"
import { Clipboard, RefreshCw, SquareX, UserCheck } from "lucide-react"

import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"

import { type Wallet } from "@/hooks/use-wallets"
import { useClientStore } from "@/providers/state-provider/client-store-provider"
import {
  useConfig,
  useCurrentChain,
  useRememberMe,
} from "@/providers/state-provider/hooks"
import { useServerStore } from "@/providers/state-provider/server-store-provider"

interface RenegadeWalletActionsDropdownProps {
  wallet: Wallet
}

export function RenegadeWalletActionsDropdown({
  wallet,
}: RenegadeWalletActionsDropdownProps) {
  const currentChainId = useCurrentChain()
  const resetWallet = useServerStore((state) => state.resetWallet)
  const config = useConfig()
  const rememberMe = useRememberMe(currentChainId)
  const setRememberMe = useClientStore((s) => s.setRememberMe)

  const handleRefreshWallet = async () => {
    if (wallet.isConnected && config) {
      await refreshWallet(config)
    }
  }

  const handleCopyWalletId = () => {
    if (wallet.isConnected) {
      navigator.clipboard.writeText(wallet.id)
    }
  }

  const handleDisconnect = () => {
    resetWallet()
  }

  return (
    <>
      <DropdownMenuLabel className="text-xs font-normal">
        {wallet.id}
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuItem
          disabled={!wallet.isConnected}
          onSelect={handleCopyWalletId}
        >
          <Clipboard />
          Copy ID
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={!wallet.isConnected}
          onSelect={handleRefreshWallet}
        >
          <RefreshCw />
          Sync wallet
        </DropdownMenuItem>
        <DropdownMenuItem
          className="flex items-center"
          onSelect={(e) => {
            e.preventDefault()
            setRememberMe(currentChainId, !rememberMe)
          }}
        >
          <UserCheck />
          <Label className="flex-1">Remember me</Label>
          <Checkbox
            checked={rememberMe}
            onCheckedChange={(checked) => {
              if (typeof checked === "boolean") {
                setRememberMe(currentChainId, checked)
              }
            }}
          />
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
