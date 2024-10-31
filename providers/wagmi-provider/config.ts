import { getDefaultConfig } from "connectkit"
import { mainnet } from "viem/chains"
import { createConfig, createStorage, http } from "wagmi"

import { cookieStorage } from "@/lib/cookie"
import { getURL } from "@/lib/utils"
import { chain } from "@/lib/viem"

export function getConfig(isDesktop?: boolean) {
  return createConfig(
    getDefaultConfig({
      // TODO: Ensure user never signs message for mainnet
      chains: [chain, mainnet],
      transports: {
        [chain.id]: http(),
        [mainnet.id]: http("/api/proxy/mainnet"),
      },
      ssr: true,
      storage: createStorage({
        storage: isDesktop ? cookieStorage : undefined,
      }),

      walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,

      appName: "Renegade",
      appDescription: "On-chain dark pool",
      appUrl: "https://trade.renegade.fi",
      appIcon: `${getURL()}/glyph_light.svg`,
    }),
  )
}
