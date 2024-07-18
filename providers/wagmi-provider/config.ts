import { chain } from "@/lib/viem"
import { cookieStorage, createConfig, createStorage, http } from "wagmi"

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
