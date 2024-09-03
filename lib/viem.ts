import { createPublicClient, defineChain, http } from "viem"
import { arbitrumSepolia, arbitrum } from "viem/chains"

export const isTestnet =
  Number(process.env.NEXT_PUBLIC_CHAIN_ID) === arbitrumSepolia.id

export const chain = isTestnet ? arbitrumSepolia : arbitrum

export const viemClient = createPublicClient({
  chain,
  transport: http(process.env.NEXT_PUBLIC_RPC_URL),
})
