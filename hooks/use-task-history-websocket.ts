import {
  useTaskHistoryWebSocket as _useTaskHistoryWebSocket,
  UseTaskHistoryWebSocketParameters as _UseTaskHistoryWebSocketParameters,
} from "@renegade-fi/react"

import { useServerStore } from "@/providers/state-provider/server-store-provider"

type UseTaskHistoryWebSocketParameters = Omit<
  _UseTaskHistoryWebSocketParameters,
  "seed" | "walletId" | "chainId"
>

export function useTaskHistoryWebSocket(
  parameters: UseTaskHistoryWebSocketParameters,
) {
  const wallet = useServerStore((state) => state.wallet)
  return _useTaskHistoryWebSocket({
    seed: wallet.seed,
    walletId: wallet.id,
    chainId: wallet.chainId,
    ...parameters,
  })
}
