import { useStatus } from "@renegade-fi/react"

import { SignInDialog } from "@/components/dialogs/sign-in-dialog"
import { Button } from "@/components/ui/button"

import { useSignInAndConnect } from "@/hooks/use-sign-in-and-connect"

export function TableEmptyState({ type }: { type: string }) {
  const status = useStatus()
  const { handleClick, content, open, onOpenChange } = useSignInAndConnect()
  let message = <>No {type} found.</>
  if (status !== "in relayer") {
    message = (
      <>
        <SignInDialog open={open} onOpenChange={onOpenChange} />
        <Button className="p-0" variant="link" onClick={handleClick}>
          Sign in
        </Button>
        &nbsp;to view your {type}.
      </>
    )
  }
  return <>{message}</>
}
