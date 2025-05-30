import { SignInDialog } from "@/components/dialogs/onboarding/sign-in-dialog"
import { NewOrderStepper } from "@/components/dialogs/order-stepper/mobile/new-order-stepper"
import { TransferDialog } from "@/components/dialogs/transfer/transfer-dialog"
import { Button } from "@/components/ui/button"

import { useSignInAndConnect } from "@/hooks/use-sign-in-and-connect"
import { useWallets } from "@/hooks/use-wallets"

export function MobileBottomBar({ base }: { base: string }) {
  const { walletReadyState } = useWallets()
  const { handleClick, content, open, onOpenChange } = useSignInAndConnect()
  return (
    <div className="fixed bottom-0 z-10 min-w-full border-t bg-background p-4 lg:hidden">
      <div className="flex gap-2">
        {walletReadyState === "READY" ? (
          <>
            <NewOrderStepper base={base}>
              <Button
                className="font-extended"
                variant="default"
              >
                Trade
              </Button>
            </NewOrderStepper>

            <TransferDialog>
              <Button
                className="font-extended"
                variant="outline"
              >
                Deposit
              </Button>
            </TransferDialog>
          </>
        ) : (
          <>
            <Button
              className="font-extended"
              variant="default"
              onClick={handleClick}
            >
              Sign in
            </Button>
            <SignInDialog
              open={open}
              onOpenChange={onOpenChange}
            />
          </>
        )}
      </div>
    </div>
  )
}
