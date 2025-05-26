import { chainIdToEnv } from "@renegade-fi/react"
import { createPublicClient, defineChain, extractChain, http } from "viem"
import {
  arbitrumSepolia,
  arbitrum,
  mainnet,
  baseSepolia,
  base,
} from "viem/chains"

import { env } from "@/env/client"

export const chain = extractChain({
  chains: [arbitrum, arbitrumSepolia, baseSepolia],
  id: env.NEXT_PUBLIC_CHAIN_ID,
})

export const environment = chainIdToEnv(chain.id)
export const isTestnet = environment === "testnet"
export const isBase = chain.id in [baseSepolia.id, base.id]

export const viemClient = createPublicClient({
  chain,
  transport: http(env.NEXT_PUBLIC_RPC_URL),
})

export const solana = defineChain({
  id: 1151111081099710,
  name: "Solana",
  nativeCurrency: {
    name: "Solana",
    symbol: "SOL",
    decimals: 9,
  },
  rpcUrls: {
    default: {
      http: ["https://api.mainnet-beta.solana.com"],
    },
  },
  blockExplorers: {
    default: {
      name: "Solana Explorer",
      url: "https://solscan.io",
    },
  },
})

export type SupportedChainId =
  | typeof mainnet.id
  | typeof chain.id
  | typeof solana.id

const supportedChains = [mainnet, chain, solana] as const

export function extractSupportedChain(chainId: number) {
  return extractChain({
    chains: supportedChains,
    id: chainId as SupportedChainId,
  })
}

export function getFormattedChainName(chainId: number): string {
  const _chain = extractSupportedChain(chainId)
  switch (_chain.id) {
    case mainnet.id:
      return "Ethereum"
    case chain.id:
      return "Arbitrum"
    case solana.id:
      return "Solana"
    default:
      return _chain.name
  }
}

export function getChainLogoTicker(chainId: number): string {
  const _chain = extractSupportedChain(chainId)
  switch (_chain.id) {
    case mainnet.id:
      return "WETH"
    case chain.id:
      return "ARB"
    case solana.id:
      return "SOL"
    default:
      return _chain.nativeCurrency.symbol
  }
}
