import { datadogRum } from "@datadog/browser-rum"
import { useWalletId } from "@renegade-fi/react"
import { BaseError, useAccount } from "wagmi"

export function useEventTracker() {
  const walletId = useWalletId()
  const { connector } = useAccount()
  const track = (event: string, params: Record<string, any> = {}) => {
    const context = {
      ...params,
      walletId,
      connector: connector?.name,
    }
    console.log("track", { event, context })
    datadogRum.addAction(event, context)
  }

  const trackMutation = (
    name: string,
    params: Record<string, any>,
    error?: Error | null,
  ) => {
    if (error?.name) {
      track(`${name}_error`, { ...params, error })
    } else {
      track(`${name}_success`, params)
    }
  }

  return { track, trackMutation }
}

export const EventNames = {
  // Darkpool
  APPROVE_DARKPOOL_TX_SENT: "approve_darkpool_tx_sent",
  APPROVE_DARKPOOL_TX_CONFIRMED: "approve_darkpool_tx_confirmed",
  DEPOSIT_TASK_STARTED: "deposit_task_started",
  // Swap
  APPROVE_SWAP_TX_SENT: "approve_swap_tx_sent",
  APPROVE_SWAP_TX_CONFIRMED: "approve_swap_tx_confirmed",
  SWAP_TX_SENT: "swap_tx_sent",
  SWAP_TX_CONFIRMED: "swap_tx_confirmed",
  // Bridge
  APPROVE_BRIDGE_TX_SENT: "approve_bridge_tx_sent",
  APPROVE_BRIDGE_CONFIRMED: "approve_bridge_confirmed",
  SOURCE_BRIDGE_TX_SENT: "source_bridge_tx_sent",
  SOURCE_BRIDGE_TX_CONFIRMED: "source_bridge_tx_confirmed",
  DESTINATION_BRIDGE_TX_CONFIRMED: "destination_bridge_tx_confirmed",
} as const
