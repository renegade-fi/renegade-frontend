import { createPublicClient, defineChain, http, extractChain } from "viem"
import { arbitrumSepolia, arbitrum, mainnet } from "viem/chains"

export const chain = extractChain({
  chains: [arbitrum, arbitrumSepolia],
  id: Number(process.env.NEXT_PUBLIC_CHAIN_ID) as 42161 | 421614,
})

export const isTestnet = chain.id === arbitrumSepolia.id

export const viemClient = createPublicClient({
  chain,
  transport: http(process.env.NEXT_PUBLIC_RPC_URL),
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
