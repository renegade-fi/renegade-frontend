import { useClientStore } from "@/providers/state-provider/client-store-provider.tsx"

export type FillIdentifier = string

export function generateFillIdentifier(
  orderId: string,
  fillTimestamp: bigint,
): FillIdentifier {
  return `${orderId}-${fillTimestamp}`
}

export function useViewedFills() {
  const { viewedFills, setViewedFills } = useClientStore((state) => state)

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
