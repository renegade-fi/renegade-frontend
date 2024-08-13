import { SignInDialog } from "@/components/dialogs/sign-in-dialog"
import { Button } from "@/components/ui/button"

import { useSignInAndConnect } from "@/hooks/use-sign-in-and-connect"
import { cn } from "@/lib/utils"

export function ConnectButton({ className }: { className?: string }) {
  const { handleClick, content, open, onOpenChange } = useSignInAndConnect()

  return (
    <>
      <Button
        onClick={e => {
          e.preventDefault()
          handleClick()
        }}
        className={cn(className)}
        size="xl"
      >
        {content}
      </Button>
      <SignInDialog open={open} onOpenChange={onOpenChange} />
    </>
  )
}
