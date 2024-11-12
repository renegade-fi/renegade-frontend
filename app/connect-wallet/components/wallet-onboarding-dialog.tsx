"use client"

import { LoadingPage } from "@/app/connect-wallet/components/steps/loading-page"

import { Dialog, DialogContent } from "@/components/ui/dialog"

import { useWalletOnboarding } from "../context/wallet-onboarding-context"
import { CompletionPage } from "./steps/completion-page"
import { ProcessingPage } from "./steps/process-task-page"
import { SelectWalletPage } from "./steps/select-wallet-page"
import { SignMessagesPage } from "./steps/sign-page"
import { SwitchNetworkPage } from "./steps/switch-network-page"

export function WalletOnboardingDialog() {
  const { currentStep, isOpen, setIsOpen } = useWalletOnboarding()

  const StepComponent = {
    SELECT_WALLET: SelectWalletPage,
    LOADING: LoadingPage,
    SWITCH_NETWORK: SwitchNetworkPage,
    SIGN_MESSAGES: SignMessagesPage,
    PROCESSING: ProcessingPage,
    COMPLETION: CompletionPage,
  }[currentStep]

  return (
    <Dialog
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <DialogContent className="max-w-sm gap-0 p-0">
        {/* {error && <div className="">{error}</div>} */}
        <StepComponent />
      </DialogContent>
    </Dialog>
  )
}
