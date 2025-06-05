import {
  useOrderHistoryWebSocket as _useOrderHistoryWebSocket,
  UseOrderHistoryWebSocketParameters as _UseOrderHistoryWebSocketParameters,
} from "@renegade-fi/react"

import { useServerStore } from "@/providers/state-provider/server-store-provider"

type UseOrderHistoryWebSocketParameters = Omit<
  _UseOrderHistoryWebSocketParameters,
  "seed" | "walletId" | "chainId"
>

export function useOrderHistoryWebSocket(
  parameters: UseOrderHistoryWebSocketParameters,
) {
  const wallet = useServerStore((state) => state.wallet)
  return _useOrderHistoryWebSocket({
    seed: wallet.seed,
    walletId: wallet.id,
    chainId: wallet.chainId,
    ...parameters,
  })
}
