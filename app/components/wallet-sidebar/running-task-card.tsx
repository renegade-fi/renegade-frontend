import { useEffect, useState } from "react"

import { Task, useTaskHistoryWebSocket } from "@renegade-fi/react"

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import {
  generateCompletionToastMessage,
  generateStartToastMessage,
} from "@/lib/constants/task"

export function RunningTaskCard() {
  const [visibleTask, setVisibleTask] = useState<Task | null>(null)
  useTaskHistoryWebSocket({
    onUpdate(task) {
      if (task.state !== "Queued") {
        setVisibleTask(task)
      }
    },
  })

  useEffect(() => {
    if (!visibleTask) return

    if (visibleTask.state === "Completed" || visibleTask.state === "Failed") {
      const timer = setTimeout(() => {
        setVisibleTask(null)
      }, 60000)

      return () => clearTimeout(timer)
    }
  }, [visibleTask])

  if (!visibleTask) return null

  const status = visibleTask.state
  const isRunning = status !== "Completed" && status !== "Failed"
  const description = isRunning
    ? generateStartToastMessage(visibleTask)
    : generateCompletionToastMessage(visibleTask)

  return (
    <div className="p-1">
      <Card className="rounded-none shadow-none">
        <form>
          <CardHeader className="p-3">
            <CardTitle className="text-sm font-normal">
              {isRunning ? (
                <span className="inline-flex animate-text-gradient bg-gradient-to-r from-[#ACACAC] via-[#363636] to-[#ACACAC] bg-[200%_auto] bg-clip-text text-transparent">
                  {status}
                </span>
              ) : (
                <span>{status}</span>
              )}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
        </form>
      </Card>
    </div>
  )
}
