import Image from "next/image"

import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

import { useWagmiMutation } from "@/app/connect-wallet/context/wagmi-mutation-context"

import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { cn } from "@/lib/utils"

export function ProcessingPage() {
  const { createWalletStatus, lookupWalletStatus, error } = useWagmiMutation()

  const title =
    createWalletStatus === "pending"
      ? "Creating"
      : lookupWalletStatus === "pending"
        ? "Looking up"
        : "Finalizing"

  const message =
    createWalletStatus === "pending"
      ? "Creating your new wallet..."
      : lookupWalletStatus === "pending"
        ? "Looking up your existing wallet..."
        : "Setting up your wallet..."

  const errorMsg =
    createWalletStatus === "error"
      ? "Couldn't create your wallet"
      : lookupWalletStatus === "error"
        ? "Couldn't find your wallet"
        : "Couldn't complete your wallet setup"

  const isPending =
    createWalletStatus === "pending" || lookupWalletStatus === "pending"

  return (
    <>
      <DialogHeader>
        <VisuallyHidden>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{message}</DialogDescription>
        </VisuallyHidden>
      </DialogHeader>

      <div className="flex flex-col items-center justify-center gap-8 p-8">
        <Image
          className={cn(isPending && "animate-pulse")}
          alt="Renegade Logo"
          height={64}
          src="/glyph_light.png"
          width={64}
        />

        <div className="flex flex-col items-center gap-2">
          <h2 className="text-xl font-semibold">
            {error ? errorMsg : message}
          </h2>
        </div>
      </div>
    </>
  )
}
