import { http } from "viem"
import { arbitrum, arbitrumSepolia, mainnet } from "viem/chains"
import {
  CreateConnectorFn,
  cookieStorage,
  createConfig,
  createStorage,
} from "wagmi"
import { coinbaseWallet, injected, safe, walletConnect } from "wagmi/connectors"

import { constructMetadata, getURL } from "@/lib/utils"
import { chain } from "@/lib/viem"

export function getConfig() {
  const metadata = constructMetadata()
  const shouldUseSafeConnector =
    !(typeof window === "undefined") && window?.parent !== window
  const connectors: CreateConnectorFn[] = []

  // If we're in an iframe, include the SafeConnector
  if (shouldUseSafeConnector) {
    connectors.push(
      safe({
        allowedDomains: [/gnosis-safe.io$/, /app.safe.global$/],
      }),
    )
  }

  // Add the rest of the connectors
  connectors.push(
    injected({ target: "metaMask" }),
    coinbaseWallet({
      appName: metadata.openGraph?.title?.toString() ?? "",
      appLogoUrl: `${getURL()}/glyph_light.svg`,
    }),
  )

  if (process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID) {
    connectors.push(
      walletConnect({
        showQrModal: false,
        projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
        metadata: {
          name: metadata.openGraph?.title?.toString() ?? "",
          description: metadata.description ?? "",
          url: getURL(),
          icons: [`${getURL()}/glyph_light.svg`],
        },
      }),
    )
  }

  return createConfig({
    chains: [chain, mainnet],
    ssr: true,
    storage: createStorage({
      storage: cookieStorage,
    }),
    transports: {
      [mainnet.id]: http(),
      [arbitrum.id]: http(),
      [arbitrumSepolia.id]: http(),
    },
    connectors,
  })
}

declare module "wagmi" {
  interface Register {
    config: ReturnType<typeof getConfig>
  }
}

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
