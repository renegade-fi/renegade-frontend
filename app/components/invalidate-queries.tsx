"use client"

import { useQueryClient } from "@tanstack/react-query"

import { useTaskHistoryWebSocket } from "@/hooks/query/use-task-history-websocket"
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
