'use client'

import { formatNumber } from '@/lib/format'
import {
  Task,
  TaskType,
  Token,
  UpdateType,
  useTaskHistory,
} from '@renegade-fi/react'

import { TokenIcon } from '@/components/token-icon'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import invariant from 'tiny-invariant'

export function TransferHistoryTable() {
  const { data } = useTaskHistory()
  const transferHistory = Array.from(data?.values() ?? []).filter(
    task =>
      (task.task_info.task_type === TaskType.UpdateWallet &&
        task.task_info.update_type === UpdateType.Deposit) ||
      (task.task_info.task_type === TaskType.UpdateWallet &&
        task.task_info.update_type === UpdateType.Withdraw),
  )
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Status</TableHead>
          <TableHead>Asset</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Size</TableHead>
          <TableHead>USD Value</TableHead>
          {/* <TableHead>ID</TableHead> */}
          <TableHead>Created At</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transferHistory.map((t, index) => (
          <Row key={index} task={t} />
        ))}
      </TableBody>
    </Table>
  )
}

function Row({ task }: { task: Task }) {
  const { task_info, state, created_at, id } = task
  invariant(task_info.task_type === TaskType.UpdateWallet, 'Invalid task type')
  const { task_type, update_type } = task_info
  invariant(
    update_type === UpdateType.Deposit || update_type === UpdateType.Withdraw,
    'Invalid update type',
  )
  const type = update_type === UpdateType.Deposit ? 'Deposit' : 'Withdraw'
  const token = Token.findByAddress(task_info.mint)
  const size = formatNumber(task_info.amount, token.decimals)
  const usdValue = formatNumber(task_info.amount, token.decimals)
  const createdAt = new Date(Number(created_at)).toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
  const status =
    state === 'Completed'
      ? 'Completed'
      : state === 'Failed'
        ? 'Failed'
        : 'Processing'
  return (
    <TableRow className="border-0">
      <TableCell>{status}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <TokenIcon size={20} ticker={token.ticker} />
          {token.name}
        </div>
      </TableCell>
      <TableCell>{type}</TableCell>
      <TableCell>{size}</TableCell>
      <TableCell>{usdValue}</TableCell>
      {/* <TableCell>{id}</TableCell> */}
      <TableCell>{createdAt}</TableCell>
    </TableRow>
  )
}
