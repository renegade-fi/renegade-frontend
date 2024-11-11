"use client"

import React from "react"

import { LoadingPage } from "@/app/connect-wallet/components/steps/loading-page"

import { Dialog, DialogContent } from "@/components/ui/dialog"

import { useWalletOnboarding } from "../context/wallet-onboarding-context"
import { CompletionPage } from "./steps/completion-page"
import { ProcessingPage } from "./steps/process-task-page"
import { SelectWalletPage } from "./steps/select-wallet"
import { SignMessagesPage } from "./steps/sign-page"
import { SwitchNetworkPage } from "./steps/switch-network-page"

export function WalletOnboardingDialog() {
  const { currentStep, error, isOpen, setIsOpen } = useWalletOnboarding()

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
  }

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
      onOpenChange={handleOpenChange}
    >
      <DialogContent>
        {error && <div className="">{error}</div>}
        <StepComponent />
      </DialogContent>
    </Dialog>
  )
}
