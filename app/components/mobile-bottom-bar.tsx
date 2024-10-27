"use client"

import { useStatus } from "@renegade-fi/react"

import { SignInDialog } from "@/components/dialogs/onboarding/sign-in-dialog"
import { NewOrderStepper } from "@/components/dialogs/order-stepper/mobile/new-order-stepper"
import { TransferDialog } from "@/components/dialogs/transfer/transfer-dialog"
import { Button } from "@/components/ui/button"

import { useSignInAndConnect } from "@/hooks/use-sign-in-and-connect"

export function MobileBottomBar({
  base,
  isUSDCDenominated,
}: {
  base: string
  isUSDCDenominated?: boolean
}) {
  const status = useStatus()
  const { handleClick, content, open, onOpenChange } = useSignInAndConnect()
  return (
    <div className="fixed bottom-0 z-10 min-w-full border-t bg-background p-4 lg:hidden">
      <div className="flex gap-2">
        {status === "in relayer" ? (
          <>
            <NewOrderStepper
              base={base}
              isUSDCDenominated={isUSDCDenominated}
            >
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
