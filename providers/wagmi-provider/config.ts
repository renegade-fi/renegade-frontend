import { http } from "viem"
import type { Chain } from "viem"
import {
  arbitrum,
  arbitrumSepolia,
  base,
  baseSepolia,
  mainnet,
} from "viem/chains"
import { cookieStorage, createConfig, createStorage } from "wagmi"

import { env } from "@/env/client"
import { getURL } from "@/lib/utils"

import getDefaultConfig from "./defaultConfig"

const chains: readonly [Chain, ...Chain[]] =
  env.NEXT_PUBLIC_CHAIN_ENVIRONMENT === "mainnet"
    ? ([arbitrum, base, mainnet] as const)
    : ([arbitrumSepolia, baseSepolia] as const)

export function getConfig() {
  return createConfig(
    getDefaultConfig({
      chains,
      transports: {
        [arbitrum.id]: http(),
        [arbitrumSepolia.id]: http(),
        [base.id]: http(),
        [baseSepolia.id]: http(),
        // Needed to support bridge
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
  chains: [arbitrum, arbitrumSepolia, baseSepolia, base],
  transports: {
    [arbitrum.id]: http(),
    [arbitrumSepolia.id]: http(),
    [baseSepolia.id]: http(),
    [base.id]: http(),
  },
})

declare module "wagmi" {
  interface Register {
    config: ReturnType<typeof getConfig>
  }
}
