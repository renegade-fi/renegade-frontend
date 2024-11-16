import { useLocalStorage } from "usehooks-ts"

import { STORAGE_VIEWED_FILLS } from "@/lib/constants/storage"

export type FillIdentifier = string

export function generateFillIdentifier(
  orderId: string,
  fillTimestamp: bigint,
): FillIdentifier {
  return `${orderId}-${fillTimestamp}`
}

export function useViewedFills() {
  const [viewedFills, setViewedFills] = useLocalStorage<FillIdentifier[]>(
    STORAGE_VIEWED_FILLS,
    [],
  )

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
