import * as React from "react"

import { usePayFees } from "@renegade-fi/react"

import { Header } from "@/components/dialogs/transfer/header"
import { ExternalTransferDirection } from "@/components/dialogs/transfer/helpers"
import { TransferForm } from "@/components/dialogs/transfer/transfer-form"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"

import { useBackOfQueueWallet } from "@/hooks/query/use-back-of-queue-wallet"
import { useFeeOnZeroBalance } from "@/hooks/use-fee-on-zero-balance"
import { useMediaQuery } from "@/hooks/use-media-query"

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
  const { data: numFees } = useBackOfQueueWallet({
    query: {
      select: (data) =>
        data.balances.filter(
          (balance) =>
            balance.protocol_fee_balance || balance.relayer_fee_balance,
        ).length,
    },
  })

  React.useEffect(() => {
    if (!open) return
    if (feeOnZeroBalance || (numFees ?? 0) > 2) {
      payFees()
    }
  }, [feeOnZeroBalance, numFees, open, payFees])

  if (isDesktop) {
    return (
      <Dialog
        open={open}
        onOpenChange={setOpen}
      >
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent
          hideCloseButton
          className="gap-0 p-0 sm:max-w-[425px]"
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
          <TransferForm
            className="p-6"
            direction={direction}
            header={
              <Header
                direction={direction}
                mint={mint}
                setDirection={setDirection}
              />
            }
            initialMint={mint}
            // onSuccess={() => setOpen(false)}
            onSuccess={() => {}}
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
          <TransferForm
            className="p-6"
            direction={direction}
            header={
              <Header
                direction={direction}
                mint={mint}
                setDirection={setDirection}
              />
            }
            initialMint={mint}
            // onSuccess={() => setOpen(false)}
            onSuccess={() => {}}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
