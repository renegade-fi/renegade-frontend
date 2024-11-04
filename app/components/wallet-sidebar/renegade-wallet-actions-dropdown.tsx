import { useConfig, useStatus } from "@renegade-fi/react"
import { refreshWallet } from "@renegade-fi/react/actions"
import { Clipboard, RefreshCw, UserCheck } from "lucide-react"
import { useLocalStorage } from "usehooks-ts"

import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"

import type { Wallet } from "@/hooks/use-wallets"
import { STORAGE_REMEMBER_ME } from "@/lib/constants/storage"

interface RenegadeWalletActionsDropdownProps {
  wallet: Wallet
}

export function RenegadeWalletActionsDropdown({
  wallet,
}: RenegadeWalletActionsDropdownProps) {
  const config = useConfig()
  const status = useStatus()
  const [rememberMe, setRememberMe] = useLocalStorage(
    STORAGE_REMEMBER_ME,
    false,
    {
      initializeWithValue: false,
    },
  )

  const handleRefreshWallet = async () => {
    if (status === "in relayer" && wallet.isConnected) {
      await refreshWallet(config)
    }
  }

  const handleCopyWalletId = () => {
    if (wallet.isConnected) {
      navigator.clipboard.writeText(wallet.id)
    }
  }

  return (
    <>
      <DropdownMenuLabel className="text-xs font-normal">
        {wallet.label}
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
            setRememberMe(!rememberMe)
          }}
        >
          <UserCheck />
          <Label className="flex-1">Remember me</Label>
          <Checkbox
            checked={rememberMe}
            onCheckedChange={(checked) => {
              if (typeof checked === "boolean") {
                setRememberMe(checked)
              }
            }}
          />
        </DropdownMenuItem>
      </DropdownMenuGroup>
    </>
  )
}
