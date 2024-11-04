import React from "react"

import { useStatus, useWalletId } from "@renegade-fi/react"
import { useWallet } from "@solana/wallet-adapter-react"
import { useAccount, useEnsName } from "wagmi"

import { mainnetConfig } from "@/providers/wagmi-provider/wagmi-provider"

export interface ConnectedWallet {
  name: string
  icon: string
  id: string
  label: string
  isConnected: true
}

export interface DisconnectedWallet {
  name: string
  icon: string | null
  id: null
  label: string
  isConnected: false
}

export type Wallet = ConnectedWallet | DisconnectedWallet

export function useWallets() {
  const renegadeStatus = useStatus()
  const walletId = useWalletId()
  const { address, connector, status } = useAccount()
  const { publicKey, wallet, connected } = useWallet()
  const { data: ensName } = useEnsName({
    address,
    config: mainnetConfig,
  })

  const renegadeWallet: Wallet = walletId
    ? {
        name: "Renegade Wallet ID",
        icon: "/glyph_light.png",
        id: walletId,
        label: walletId,
        isConnected: true,
      }
    : {
        name: "Renegade Wallet ID",
        icon: "/glyph_light.png",
        id: null,
        label: "Not Connected",
        isConnected: false,
      }

  const arbitrumWallet: Wallet =
    address && connector
      ? {
          name: "Arbitrum Address",
          icon: connector.icon ?? "",
          id: address,
          label: ensName || address,
          isConnected: true,
        }
      : {
          name: "Arbitrum Address",
          icon: null,
          id: null,
          label: "Not Connected",
          isConnected: false,
        }
  const solanaWallet: Wallet =
    connected && publicKey && wallet
      ? {
          name: "Solana Address",
          icon: wallet.adapter.icon ?? "",
          id: publicKey.toString(),
          label: publicKey.toString(),
          isConnected: true,
        }
      : {
          name: "Solana Address",
          icon: null,
          id: null,
          label: "Not Connected",
          isConnected: false,
        }

  const [isWalletsSynced, setIsWalletsSynced] = React.useState(() =>
    Boolean(renegadeStatus === "in relayer" && address && connector),
  )

  React.useEffect(() => {
    if (status !== "reconnecting") {
      if (status === "connected") {
        setIsWalletsSynced(true)
      } else if (status === "disconnected") {
        setIsWalletsSynced(false)
      }
    }
  }, [status])

  return {
    renegadeWallet,
    arbitrumWallet,
    solanaWallet,
    isWalletsSynced,
  } as const
}
