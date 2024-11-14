import { useBackOfQueueWallet } from "@renegade-fi/react"

export function useInRelayer() {
  const { data, status } = useBackOfQueueWallet()
  return Boolean(status === "success" && data.id)
}
