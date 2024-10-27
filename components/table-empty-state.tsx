import { useStatus } from "@renegade-fi/react"

import { SignInDialog } from "@/components/dialogs/onboarding/sign-in-dialog"
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
        className={status !== "in relayer" ? "cursor-pointer" : ""}
        onClick={() => {
          if (status !== "in relayer") {
            handleClick()
          }
        }}
      >
        <TableCell
          className="h-24 pl-8 lg:pl-0 lg:text-center"
          colSpan={colSpan}
        >
          {message}
        </TableCell>
      </TableRow>
      <SignInDialog
        open={open}
        onOpenChange={onOpenChange}
      />
    </>
  )
}
