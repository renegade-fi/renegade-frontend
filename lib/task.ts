import { Task, TaskType, UpdateType } from "@renegade-fi/react"

export function isCancelOrderTask(task: Task): task is Task & {
  task_info: {
    task_type: TaskType.UpdateWallet
    update_type: UpdateType.CancelOrder
  }
} {
  return (
    task.task_info.task_type === TaskType.UpdateWallet &&
    task.task_info.update_type === UpdateType.CancelOrder
  )
}

export function isDepositTask(task: Task): task is Task & {
  task_info: {
    task_type: TaskType.UpdateWallet
    update_type: UpdateType.Deposit
  }
} {
  return (
    task.task_info.task_type === TaskType.UpdateWallet &&
    task.task_info.update_type === UpdateType.Deposit
  )
}

export function isWithdrawTask(task: Task): task is Task & {
  task_info: {
    task_type: TaskType.UpdateWallet
    update_type: UpdateType.Withdraw
    mint: `0x${string}`
    amount: bigint
  }
} {
  return (
    task.task_info.task_type === TaskType.UpdateWallet &&
    task.task_info.update_type === UpdateType.Withdraw
  )
}

export function isPayFeesTask(task: Task): task is Task & {
  task_info: {
    task_type: TaskType.PayOfflineFee
    mint: `0x${string}`
    amount: bigint
    is_protocol: boolean
  }
} {
  return task.task_info.task_type === TaskType.PayOfflineFee
}

export function isSettleMatchTask(task: Task): task is Task & {
  task_info: {
    task_type: TaskType.SettleMatch
    base: `0x${string}`
    is_sell: boolean
    quote: `0x${string}`
    volume: bigint
  }
} {
  return task.task_info.task_type === TaskType.SettleMatch
}
