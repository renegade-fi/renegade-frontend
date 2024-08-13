import { useStatus } from "@renegade-fi/react"

import { SignInDialog } from "@/components/dialogs/sign-in-dialog"
import { TableCell, TableRow } from "@/components/ui/table"

import { useSignInAndConnect } from "@/hooks/use-sign-in-and-connect"

export function TableEmptyState({
  colSpan,
  type,
}: {
  colSpan: number
  type: string
}) {
  const status = useStatus()
  const { handleClick, content, open, onOpenChange } = useSignInAndConnect()
  let message = `No ${type} found.`
  if (status !== "in relayer") {
    message = `Sign in to view your ${type}.`
  }
  return (
    <>
      <TableRow
        onClick={() => {
          if (status !== "in relayer") {
            handleClick()
          }
        }}
      >
        <TableCell colSpan={colSpan} className="h-24 text-center">
          {message}
        </TableCell>
      </TableRow>
      <SignInDialog open={open} onOpenChange={onOpenChange} />
    </>
  )
}
