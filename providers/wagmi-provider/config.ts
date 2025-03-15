import { WagmiAdapter } from "@reown/appkit-adapter-wagmi"
import { http } from "viem"
import { arbitrum, arbitrumSepolia, mainnet } from "viem/chains"
import { cookieStorage, createConfig, createStorage } from "wagmi"

import { chain } from "@/lib/viem"

export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage,
  }),
  ssr: true,
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
  networks: [mainnet, chain],
})

export const wagmiConfig = wagmiAdapter.wagmiConfig

export const mainnetConfig = createConfig({
  chains: [mainnet],
  transports: {
    [mainnet.id]: http("/api/proxy/mainnet"),
  },
})

export const arbitrumConfig = createConfig({
  chains: [chain],
  transports: {
    [arbitrum.id]: http(),
    [arbitrumSepolia.id]: http(),
  },
})
