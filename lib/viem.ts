import { createPublicClient, defineChain, http } from "viem"
import { arbitrumSepolia, arbitrum } from "viem/chains"

export const viemClient = createPublicClient({
  chain: Number(process.env.NEXT_PUBLIC_CHAIN_ID) === arbitrum.id ? arbitrum : arbitrumSepolia,
  transport: http(process.env.NEXT_PUBLIC_RPC_URL),
})
