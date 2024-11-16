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
    console.debug(`[useViewedFills] Marking fill as viewed:`, {
      fillId,
      wasAlreadyViewed: viewedFills.includes(fillId),
      currentViewedFills: viewedFills,
    })

    if (!viewedFills.includes(fillId)) {
      setViewedFills([...viewedFills, fillId])
      console.debug(`[useViewedFills] Updated viewed fills:`, [
        ...viewedFills,
        fillId,
      ])
    }
  }

  const isFillViewed = (fillId: FillIdentifier) => {
    const isViewed = viewedFills.includes(fillId)
    console.debug(`[useViewedFills] Checking if fill is viewed:`, {
      fillId,
      isViewed,
      currentViewedFills: viewedFills,
    })
    return isViewed
  }

  console.debug(
    `[useViewedFills] Hook rendered with viewed fills:`,
    viewedFills,
  )

  return {
    viewedFills,
    markFillAsViewed,
    isFillViewed,
  }
}
