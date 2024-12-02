import { http } from "viem"
import { arbitrum, arbitrumSepolia, mainnet } from "viem/chains"
import { cookieStorage, createConfig, createStorage } from "wagmi"

import { chain } from "@/lib/viem"

export const wagmiConfig = createConfig({
  chains: [chain, mainnet],
  transports: {
    [arbitrum.id]: http(),
    [arbitrumSepolia.id]: http(),
    [mainnet.id]: http("/api/proxy/mainnet"),
  },
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
})

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
