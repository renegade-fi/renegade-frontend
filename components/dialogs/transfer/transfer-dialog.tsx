import * as React from "react"

import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { usePayFees } from "@renegade-fi/react"

import { ExternalTransferDirection } from "@/components/dialogs/transfer/helpers"
import { TransferForm } from "@/components/dialogs/transfer/transfer-form"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import { useFeeOnZeroBalance } from "@/hooks/use-fee-on-zero-balance"
import { useMediaQuery } from "@/hooks/use-media-query"
import { cn } from "@/lib/utils"

export function TransferDialog({
  mint,
  children,
}: {
  mint?: `0x${string}`
  children: React.ReactNode
}) {
  const [open, setOpen] = React.useState(false)
  const isDesktop = useMediaQuery("(min-width: 1024px)")
  const [direction, setDirection] = React.useState<ExternalTransferDirection>(
    ExternalTransferDirection.Deposit,
  )

  const { payFees } = usePayFees()
  const feeOnZeroBalance = useFeeOnZeroBalance()

  React.useEffect(() => {
    if (open && feeOnZeroBalance) {
      payFees()
    }
  }, [open, payFees, feeOnZeroBalance])

  if (isDesktop) {
    return (
      <Dialog
        open={open}
        onOpenChange={setOpen}
      >
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent
          hideCloseButton
          className="max-h-[80vh] gap-0 p-0 sm:max-w-[425px]"
          onPointerDownOutside={(e) => {
            // Prevent closing the dialog when clicking inside toast
            if (
              e.target instanceof Element &&
              e.target.closest("[data-sonner-toast]")
            ) {
              e.preventDefault()
            }
          }}
        >
          <DialogHeader>
            <div className="flex flex-row border-b border-border">
              <Button
                className={cn(
                  "flex-1 border-0 font-extended text-lg font-bold",
                  direction === ExternalTransferDirection.Deposit
                    ? "text-primary"
                    : "text-muted-foreground",
                )}
                size="xl"
                variant="outline"
                onClick={() => setDirection(ExternalTransferDirection.Deposit)}
              >
                Deposit
              </Button>
              <Button
                className={cn(
                  "border-l-1 flex-1 border-y-0 border-r-0 font-extended text-lg font-bold",
                  direction === ExternalTransferDirection.Withdraw
                    ? "text-primary"
                    : "text-muted-foreground",
                )}
                size="xl"
                variant="outline"
                onClick={() => setDirection(ExternalTransferDirection.Withdraw)}
              >
                Withdraw
              </Button>
            </div>
            <VisuallyHidden>
              <DialogTitle>
                {direction === ExternalTransferDirection.Deposit
                  ? "Deposit"
                  : "Withdraw"}
              </DialogTitle>
              <DialogDescription>
                {direction === ExternalTransferDirection.Deposit
                  ? "Deposit tokens into Renegade"
                  : "Withdraw tokens from Renegade"}
              </DialogDescription>
            </VisuallyHidden>
          </DialogHeader>
          <TransferForm
            className="p-6"
            direction={direction}
            initialMint={mint}
            onSuccess={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="h-dvh p-0">
        <div className="flex flex-col">
          <DialogHeader className="">
            <VisuallyHidden>
              <DialogTitle>
                {direction === ExternalTransferDirection.Deposit
                  ? "Deposit"
                  : "Withdraw"}
              </DialogTitle>
              <DialogDescription>
                {direction === ExternalTransferDirection.Deposit
                  ? "Deposit tokens into Renegade"
                  : "Withdraw tokens from Renegade"}
              </DialogDescription>
            </VisuallyHidden>
          </DialogHeader>
          <div className="mt-12 flex flex-row px-6 font-extended">
            <Button
              className={cn(
                "flex-1 text-lg tracking-tight",
                direction === ExternalTransferDirection.Deposit
                  ? "text-primary"
                  : "text-muted-foreground",
              )}
              size="xl"
              variant="outline"
              onClick={() => setDirection(ExternalTransferDirection.Deposit)}
            >
              Deposit
            </Button>
            <Button
              className={cn(
                "flex-1 border-l-0 text-lg tracking-tight",
                direction === ExternalTransferDirection.Withdraw
                  ? "text-primary"
                  : "text-muted-foreground",
              )}
              size="xl"
              variant="outline"
              onClick={() => setDirection(ExternalTransferDirection.Withdraw)}
            >
              Withdraw
            </Button>
          </div>
          <TransferForm
            className="p-6"
            direction={direction}
            initialMint={mint}
            onSuccess={() => setOpen(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
