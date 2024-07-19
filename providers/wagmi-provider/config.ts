import { cookieStorage, createConfig, createStorage, http } from "wagmi"

import { chain } from "@/lib/viem"

export const config = createConfig({
  chains: [chain],
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
  transports: {
    [chain.id]: http(),
  },
})
