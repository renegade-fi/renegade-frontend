import { http } from "viem"
import { mainnet, arbitrum, arbitrumSepolia, baseSepolia } from "viem/chains"
import { createConfig, createStorage, cookieStorage } from "wagmi"

import { env } from "@/env/client"
import { getURL } from "@/lib/utils"
import { chain } from "@/lib/viem"

import getDefaultConfig from "./defaultConfig"

export function getConfig() {
  return createConfig(
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

      walletConnectProjectId: env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,

      appName: "Renegade",
      appDescription: "On-chain dark pool",
      appUrl: getURL(),
      appIcon: `${getURL()}/glyph_light.svg`,
    }),
  )
}

export const mainnetConfig = createConfig({
  chains: [mainnet],
  transports: {
    [mainnet.id]: http("/api/proxy/mainnet"),
  },
})

// @sehyunc TODO: generalize wagmi config
export const arbitrumConfig = createConfig({
  chains: [chain],
  transports: {
    [arbitrum.id]: http(),
    [arbitrumSepolia.id]: http(),
    [baseSepolia.id]: http(),
  },
})

declare module "wagmi" {
  interface Register {
    config: ReturnType<typeof getConfig>
  }
}
