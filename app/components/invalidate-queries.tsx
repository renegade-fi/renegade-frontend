"use client"

import { useTaskHistoryWebSocket } from "@renegade-fi/react"
import { useQueryClient } from "@tanstack/react-query"

import { shouldInvalidate } from "@/lib/query"

export function InvalidateQueries() {
  const queryClient = useQueryClient()
  useTaskHistoryWebSocket({
    onUpdate: (task) => {
      if (task.state === "Completed") {
        queryClient.invalidateQueries({
          predicate: (query) => shouldInvalidate(query, queryClient),
        })
      }
    },
  })
  return null
}
