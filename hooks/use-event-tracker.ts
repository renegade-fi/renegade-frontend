import { datadogRum } from "@datadog/browser-rum"
import { useWalletId } from "@renegade-fi/react"
import { useAccount } from "wagmi"

export function useEventTracker() {
  const walletId = useWalletId()
  const { connector, chainId } = useAccount()
  const track = (event: string, params: Record<string, any>) => {
    const context = {
      ...params,
      walletId,
      connector: connector?.name,
      chainId,
    }
    console.log("track", { event, context })
    datadogRum.addAction(event, context)
  }

  return { track }
}

export const EventNames = {
  APPROVE_SWAP_COMPLETED: "approve_swap_completed",
  SWAP_COMPLETED: "swap_completed",
  DEPOSIT_TASK_STARTED: "deposit_task_started",
  APPROVE_BRIDGE_COMPLETED: "approve_bridge_completed",
  BRIDGE_COMPLETED: "bridge_completed",
  APPROVE_DARKPOOL_COMPLETED: "approve_darkpool_completed",
  APPROVE_SWAP_ERROR: "approve_swap_error",
  SWAP_ERROR: "swap_error",
  DEPOSIT_ERROR: "deposit_error",
  APPROVE_BRIDGE_ERROR: "approve_bridge_error",
  BRIDGE_ERROR: "bridge_error",
  APPROVE_DARKPOOL_ERROR: "approve_darkpool_error",
} as const
