"use client"

import { useTaskHistoryWebSocket } from "@renegade-fi/react"
import { useQueryClient } from "@tanstack/react-query"

export function InvalidateQueries() {
  const queryClient = useQueryClient()
  useTaskHistoryWebSocket({
    onUpdate: (task) => {
      if (task.state === "Completed") {
        // TODO: Only invalidate queries related to wallet state
        queryClient.invalidateQueries()
      }
    },
  })

  return null
}
