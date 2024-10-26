"use client"

import { type FC, type PropsWithChildren } from "react"

import type { Adapter } from "@solana/wallet-adapter-base"
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base"
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react"
import { clusterApiUrl } from "@solana/web3.js"

/**
 * Wallets that implement either of these standards will be available automatically.
 *
 *   - Solana Mobile Stack Mobile Wallet Adapter Protocol
 *     (https://github.com/solana-mobile/mobile-wallet-adapter)
 *   - Solana Wallet Standard
 *     (https://github.com/solana-labs/wallet-standard)
 *
 * If you wish to support a wallet that supports neither of those standards,
 * instantiate its legacy wallet adapter here. Common legacy adapters can be found
 * in the npm package `@solana/wallet-adapter-wallets`.
 */
const wallets: Adapter[] = []

const endpoint =
  typeof window !== "undefined"
    ? new URL("/api/proxy/solana", window.location.origin).toString()
    : clusterApiUrl(WalletAdapterNetwork.Mainnet)

export const SolanaProvider: FC<PropsWithChildren> = ({ children }) => {
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider
        autoConnect
        wallets={wallets}
      >
        {children}
      </WalletProvider>
    </ConnectionProvider>
  )
}
