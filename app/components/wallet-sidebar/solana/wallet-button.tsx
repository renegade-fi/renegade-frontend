import { SolanaWalletActionsDropdown } from "@/app/components/wallet-sidebar/solana-wallet-actions-dropdown"
import { WalletButton } from "@/app/components/wallet-sidebar/wallet-button"

import { useWallets } from "@/hooks/use-wallets"

import { ConnectButton } from "./connect-button"
import { SolanaConnectDialog } from "./connect-dialog"

export function SolanaWalletButton() {
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
    <ConnectButton>
      <SolanaConnectDialog />
    </ConnectButton>
  )
}
