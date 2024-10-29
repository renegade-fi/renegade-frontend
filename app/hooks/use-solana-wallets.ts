import { useMemo } from "react"

import { WalletReadyState } from "@solana/wallet-adapter-base"
import { useWallet } from "@solana/wallet-adapter-react"

export const useWallets = () => {
  const { wallets: solanaWallets } = useWallet()

  const wallets = useMemo(() => {
    const svmInstalled = solanaWallets?.filter(
      (connector) =>
        connector.adapter.readyState === WalletReadyState.Installed &&
        // We should not show already connected connectors
        !connector.adapter.connected,
    )
    const svmNotDetected = solanaWallets?.filter(
      (connector) =>
        connector.adapter.readyState !== WalletReadyState.Installed,
    )

    const installedWallets = [...svmInstalled]

    return installedWallets
  }, [])

  return wallets
}