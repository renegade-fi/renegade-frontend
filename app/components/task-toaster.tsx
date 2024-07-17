'use client'

import { useEffect, useRef, useState } from 'react'

import { Task, TaskType, useTaskHistoryWebSocket } from '@renegade-fi/react'
import { toast } from 'sonner'

import {
  generateCompletionToastMessage,
  generateFailedToastMessage,
  generateStartToastMessage,
} from '@/lib/constants/task'

export function TaskToaster() {
  const [incomingTask, setIncomingTask] = useState<Task>()
  useTaskHistoryWebSocket({
    onUpdate(task) {
      setIncomingTask(task)
    },
  })
  const taskIdToStateMap = useRef<Map<string, Task>>(new Map())
  const taskIdToToastIdMap = useRef<Map<string, string | number>>(new Map())

  useEffect(() => {
    if (incomingTask) {
      // Ignore duplicate events
      if (
        taskIdToStateMap.current.get(incomingTask.id)?.state ===
        incomingTask.state
      ) {
        return
      }
      taskIdToStateMap.current.set(incomingTask.id, incomingTask)

      // Order toaster handles SettleMatch task completion
      if (incomingTask.task_info.task_type === TaskType.SettleMatch) {
        return
      }

      if (incomingTask.state === 'Completed') {
        const message = generateCompletionToastMessage(incomingTask)
        const toastId = taskIdToToastIdMap.current.get(incomingTask.id)
        toast.success(message, {
          id: toastId,
        })
        return
      } else if (incomingTask.state === 'Failed') {
        const message = generateFailedToastMessage(incomingTask)
        const toastId = taskIdToToastIdMap.current.get(incomingTask.id)
        toast.error(message, {
          id: toastId,
        })
      } else if (incomingTask.state === 'Proving') {
        const message = generateStartToastMessage(incomingTask)
        const id = toast.loading(message)
        taskIdToToastIdMap.current.set(incomingTask.id, id)
      } else if (incomingTask.state === 'Proving Payment') {
        const message = generateStartToastMessage(incomingTask)
        const id = toast.loading(message)
        taskIdToToastIdMap.current.set(incomingTask.id, id)
      }
    }
  }, [incomingTask])
  return null
}
