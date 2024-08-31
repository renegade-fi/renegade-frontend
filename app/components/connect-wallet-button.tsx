import { SignInDialog } from "@/components/dialogs/sign-in-dialog"
import { Button } from "@/components/ui/button"

import { useSignInAndConnect } from "@/hooks/use-sign-in-and-connect"

export function ConnectWalletButton() {
  const { handleClick, content, open, onOpenChange } = useSignInAndConnect()

  return (
    <>
      <Button
        className="border border-[#333333] font-extended text-base hover:border-[#999999]"
        size="shimmer"
        variant="shimmer"
        onClick={handleClick}
      >
        {content}
      </Button>
      <SignInDialog
        open={open}
        onOpenChange={onOpenChange}
      />
    </>
  )
}
