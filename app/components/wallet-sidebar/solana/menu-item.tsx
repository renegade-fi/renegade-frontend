import { SolanaWalletActionsDropdown } from "@/app/components/wallet-sidebar/solana-wallet-actions-dropdown"
import { WalletButton } from "@/app/components/wallet-sidebar/wallet-button"

import { useWallets } from "@/hooks/use-wallets"

import { ConnectContent } from "./connect-content"
import { ConnectDialog } from "./connect-dialog"

export function SolanaMenuItem() {
  const { solanaWallet } = useWallets()

  if (solanaWallet.isConnected) {
    return (
      <WalletButton
        dropdownContent={<SolanaWalletActionsDropdown wallet={solanaWallet} />}
        wallet={solanaWallet}
      />
    )
  }

  return (
    <ConnectDialog>
      <ConnectContent />
    </ConnectDialog>
  )
}
