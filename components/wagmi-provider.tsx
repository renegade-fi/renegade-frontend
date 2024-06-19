'use client'

import { WagmiProvider as Provider, createConfig, http } from 'wagmi'
import { arbitrumSepolia } from 'wagmi/chains'

export const config = createConfig({
  chains: [arbitrumSepolia],
  transports: {
    [arbitrumSepolia.id]: http(),
  },
})

export function WagmiProvider({ children }: { children: React.ReactNode }) {
  return <Provider config={config}>{children}</Provider>
}
