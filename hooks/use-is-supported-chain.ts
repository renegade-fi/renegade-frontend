import { useConfig } from "wagmi"

/** Returns true if the given chain is configured in the wagmi config */
export function useIsSupportedChain(chainId?: number): boolean | null {
  const { chains } = useConfig()
  if (!chainId) return false
  return chains.some((x) => x.id === chainId)
}
