import { getDefaultConfig } from "connectkit"
import { http } from "viem"
import { mainnet, arbitrum, arbitrumSepolia } from "viem/chains"
import { createConfig, createStorage, cookieStorage } from "wagmi"

import { getURL } from "@/lib/utils"
import { chain } from "@/lib/viem"

export const wagmiConfig = createConfig(
  getDefaultConfig({
    chains: [chain, mainnet],
    transports: {
      [chain.id]: http(),
      [mainnet.id]: http("/api/proxy/mainnet"),
    },
    ssr: true,
    storage: createStorage({
      storage: cookieStorage,
    }),

    walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,

    appName: "Renegade",
    appDescription: "On-chain dark pool",
    appUrl: "https://trade.renegade.fi",
    appIcon: `${getURL()}/glyph_light.svg`,
  }),
)

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
