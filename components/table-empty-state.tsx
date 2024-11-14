import { SignInDialog } from "@/components/dialogs/onboarding/sign-in-dialog"
import { TableCell, TableRow } from "@/components/ui/table"

import { useSignInAndConnect } from "@/hooks/use-sign-in-and-connect"
import { useWallets } from "@/hooks/use-wallets"

export function TableEmptyState({
  colSpan,
  type,
}: {
  colSpan: number
  type: string
}) {
  const { walletReadyState } = useWallets()
  const { handleClick, content, open, onOpenChange } = useSignInAndConnect()
  let message = `No ${type} found.`
  if (walletReadyState !== "READY") {
    message = `Sign in to view your ${type}.`
  }
  return (
    <>
      <TableRow
        className={walletReadyState !== "READY" ? "cursor-pointer" : ""}
        onClick={() => {
          if (walletReadyState !== "READY") {
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
