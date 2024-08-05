import { cookieStorage, createConfig, createStorage, http } from "wagmi"

import { chain } from "@/lib/viem"

// Two configs are needed because wagmi connectors are not able to be loaded on the server,
// but a config is needed to initialize cookies storage server side
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
