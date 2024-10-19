"use client"

import { useTaskHistoryWebSocket } from "@renegade-fi/react"
import { Query, useQueryClient } from "@tanstack/react-query"

export function InvalidateQueries() {
  const queryClient = useQueryClient()
  useTaskHistoryWebSocket({
    onUpdate: (task) => {
      if (task.state === "Completed") {
        // TODO: Only invalidate queries related to wallet state
        // queryClient.invalidateQueries()
        const nonStaticQueries = (query: Query) => {
          const defaultStaleTime =
            queryClient.getQueryDefaults(query.queryKey).staleTime ?? 0
          const staleTimes = query.observers
            .map((observer) => observer.options.staleTime ?? Infinity)
            .filter((staleTime): staleTime is number => staleTime !== undefined)

          const staleTime =
            query.getObserversCount() > 0
              ? Math.min(...staleTimes)
              : defaultStaleTime

          return staleTime !== Number.POSITIVE_INFINITY
        }
        queryClient.invalidateQueries({
          predicate: nonStaticQueries,
        })
      }
    },
  })

  return null
}
