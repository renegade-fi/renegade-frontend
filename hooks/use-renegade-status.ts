import { useServerStore } from "@/providers/state-provider/server-store-provider"

/**
 * @returns true if Renegade wallet seed has been generated
 */
export function useRenegadeStatus() {
  const { seed, chainId, id } = useServerStore((state) => state.wallet)
  return { isConnected: seed && chainId && id }
}
