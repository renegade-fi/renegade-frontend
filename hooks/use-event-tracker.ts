import { datadogRum } from "@datadog/browser-rum"
import { useWalletId } from "@renegade-fi/react"
import { BaseError, useAccount } from "wagmi"

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

  const trackMutation = (
    name: string,
    params: Record<string, any>,
    error?: Error | null,
  ) => {
    if (error?.name) {
      track(`${name}_error`, { ...params, ...error })
    } else {
      track(`${name}_completed`, params)
    }
  }

  return { track, trackMutation }
}

export const EventNames = {
  APPROVE_SWAP: "approve_swap",
  SWAP: "swap",
  DEPOSIT_TASK_STARTED: "deposit_task_started",
  APPROVE_BRIDGE: "approve_bridge",
  BRIDGE: "bridge",
  APPROVE_DARKPOOL: "approve_darkpool",
} as const
