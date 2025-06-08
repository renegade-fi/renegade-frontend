import { useIsWalletConnected } from "@/providers/state-provider/hooks"

/**
 * @returns true if Renegade wallet seed has been generated
 */
export function useRenegadeStatus() {
  const isConnected = useIsWalletConnected()
  return { isConnected }
}
