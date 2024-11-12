import { http } from "viem"
import { arbitrum, arbitrumSepolia, mainnet } from "viem/chains"
import { cookieStorage, createConfig, createStorage } from "wagmi"
import { coinbaseWallet, metaMask, safe, walletConnect } from "wagmi/connectors"

import { getURL } from "@/lib/utils"
import { chain } from "@/lib/viem"

export const wagmiConfig = createConfig({
  chains: [chain, mainnet],
  transports: {
    [arbitrum.id]: http(),
    [arbitrumSepolia.id]: http(),
    [mainnet.id]: http(`${getURL()}/api/proxy/mainnet`),
  },
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
  connectors: [
    // injected(),
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
      qrModalOptions: {
        themeMode: "dark",
      },
    }),
    metaMask(),
    safe(),
    coinbaseWallet({
      appName: "Renegade",
      darkMode: true,
      appLogoUrl: `${getURL()}/glyph_light.svg`,
      preference: "eoaOnly",
    }),
  ],
})

export const mainnetConfig = createConfig({
  chains: [mainnet],
  transports: {
    [mainnet.id]: http(`${getURL()}/api/proxy/mainnet`),
  },
})

export const arbitrumConfig = createConfig({
  chains: [chain],
  transports: {
    [arbitrum.id]: http(),
    [arbitrumSepolia.id]: http(),
  },
})
