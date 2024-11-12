import Image from "next/image"

import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { useWalletOnboarding } from "../../context/wallet-onboarding-context"

export function CompletionPage() {
  const { setIsOpen } = useWalletOnboarding()

  return (
    <>
      <DialogHeader>
        <VisuallyHidden>
          <DialogTitle>Success</DialogTitle>
          <DialogDescription>
            You've successfully connected your wallet.
          </DialogDescription>
        </VisuallyHidden>
      </DialogHeader>

      <div className="flex flex-col items-center justify-center gap-8 p-8">
        <Image
          alt="Renegade Logo"
          height={64}
          src="/glyph_light.png"
          width={64}
        />

        <div className="flex flex-col items-center gap-2">
          <h2 className="text-xl font-semibold">
            Renegade wallet is ready to trade.
          </h2>
        </div>
      </div>
    </>
  )
}
