import { CheckCircle2 } from "lucide-react"

import { Button } from "@/components/ui/button"

import { useWalletOnboarding } from "../../context/wallet-onboarding-context"

export function CompletionPage() {
  const { setIsOpen } = useWalletOnboarding()

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-8">
      <CheckCircle2 className="h-8 w-8 text-primary" />
      <h2 className="text-lg font-semibold">Setup Complete</h2>
      <p className="text-sm text-muted-foreground">
        Your wallet has been successfully connected
      </p>
      <Button onClick={() => setIsOpen(false)}>Close</Button>
    </div>
  )
}
