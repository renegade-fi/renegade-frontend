import { ConnectWalletButton } from "@/app/connect-wallet/components/connect-wallet-button"
import { DisconnectWalletButton } from "@/app/connect-wallet/components/disconnect-wallet-button"

import { WalletOnboardingDialog } from "./components/wallet-onboarding-dialog"
import { WalletOnboardingProvider } from "./context/wallet-onboarding-context"

export default function ConnectWalletPage() {
  return (
    <WalletOnboardingProvider>
      <WalletOnboardingDialog />
      <ConnectWalletButton />
      <DisconnectWalletButton />
    </WalletOnboardingProvider>
  )
}
