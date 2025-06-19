import { useClientStore } from "@/providers/state-provider/client-store-provider"

export type FillIdentifier = string

export function generateFillIdentifier(
  orderId: string,
  fillTimestamp: bigint,
): FillIdentifier {
  return `${orderId}-${fillTimestamp}`
}

export function useViewedFills() {
  const viewedFills = useClientStore((s) => s.viewedFills)
  const setViewedFills = useClientStore((s) => s.setViewedFills)

  const markFillAsViewed = (fillId: FillIdentifier) => {
    if (!viewedFills.includes(fillId)) {
      setViewedFills([...viewedFills, fillId])
    }
  }

  const isFillViewed = (fillId: FillIdentifier) => {
    const isViewed = viewedFills.includes(fillId)
    return isViewed
  }

  return {
    viewedFills,
    markFillAsViewed,
    isFillViewed,
  }
}
