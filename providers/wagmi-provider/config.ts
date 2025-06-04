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

export const MAINNET_CHAINS = [arbitrum, base] as const
export const TESTNET_CHAINS = [arbitrumSepolia, baseSepolia] as const

const chains: readonly [Chain, ...Chain[]] =
  env.NEXT_PUBLIC_CHAIN_ENVIRONMENT === "mainnet"
    ? [...MAINNET_CHAINS, mainnet]
    : [...TESTNET_CHAINS]

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
      coinbaseWalletPreference: "eoaOnly",

      appName: "Renegade",
      appDescription: "On-chain dark pool",
      appUrl: getURL(),
      appIcon: `${getURL()}/glyph_light.svg`,
    }),
  )
}

/** Chains available in the environment */
export const AVAILABLE_CHAINS =
  env.NEXT_PUBLIC_CHAIN_ENVIRONMENT === "mainnet"
    ? MAINNET_CHAINS
    : TESTNET_CHAINS

/** Chain logo mapping */
export const CHAIN_LOGOS = {
  42161: "/arbitrum.svg",
  421614: "/arbitrum.svg",
  8453: "/base.svg",
  84532: "/base.svg",
} as const

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
