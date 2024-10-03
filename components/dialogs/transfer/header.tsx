import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

import { ExternalTransferDirection } from "@/components/dialogs/transfer/helpers"
import { Button } from "@/components/ui/button"
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { useMediaQuery } from "@/hooks/use-media-query"
import { cn } from "@/lib/utils"

export function Header({
  direction,
  setDirection,
  mint,
}: {
  direction: ExternalTransferDirection
  setDirection: (direction: ExternalTransferDirection) => void
  mint?: `0x${string}`
}) {
  const isDesktop = useMediaQuery("(min-width: 1024px)")

  if (isDesktop) {
    return (
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
    )
  }

  return (
    <>
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
    </>
  )
}
