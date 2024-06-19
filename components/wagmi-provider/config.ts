import { getDefaultConfig } from 'connectkit'
import { cookieStorage, createConfig, createStorage, http } from 'wagmi'
import { arbitrumSepolia } from 'wagmi/chains'

export const config = createConfig({
  chains: [arbitrumSepolia],
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
  transports: {
    [arbitrumSepolia.id]: http(),
  },
})
