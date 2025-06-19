import React from "react"

import { isSupportedChainId } from "@renegade-fi/react"
import { getWalletId } from "@renegade-fi/react/actions"
import { ROOT_KEY_MESSAGE_PREFIX } from "@renegade-fi/react/constants"
import { MutationStatus } from "@tanstack/react-query"
import { Check, Loader2, X } from "lucide-react"
import { BaseError } from "viem"
import { useDisconnect, useSignMessage, useSwitchChain } from "wagmi"

import {
  NonDeterministicWalletError,
  Step,
  isNonDeterministicWalletError,
} from "@/components/dialogs/onboarding/types"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

import { useMediaQuery } from "@/hooks/use-media-query"
import { sidebarEvents } from "@/lib/events"
import { cn } from "@/lib/utils"
import { getConfigFromChainId } from "@/providers/renegade-provider/config"
import {
  useCurrentChain,
  useRememberMe,
} from "@/providers/state-provider/hooks"
import { useServerStore } from "@/providers/state-provider/server-store-provider"

export function SignInDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const currentChainId = useCurrentChain()
  const { disconnectAsync } = useDisconnect()
  const isDesktop = useMediaQuery("(min-width: 1024px)")
  const [currentStep, setCurrentStep] = React.useState<number | undefined>(
    undefined,
  )
  const setWallet = useServerStore((state) => state.setWallet)

  const {
    data: signMessage1Data,
    signMessage: signMessage1,
    status: signStatus1,
    reset: reset1,
    error: signMessage1Error,
  } = useSignMessage({
    mutation: {
      onMutate() {
        setCurrentStep(0)
      },
      onSuccess() {
        signMessage2({
          message: `${ROOT_KEY_MESSAGE_PREFIX} ${currentChainId}`,
        })
      },
    },
  })

  const {
    signMessage: signMessage2,
    status: signStatus2,
    reset: reset2,
    error: signMessage2Error,
  } = useSignMessage({
    mutation: {
      onMutate() {
        setCurrentStep(1)
      },
      onSuccess(data) {
        if (!data || !signMessage1Data) throw new Error("Missing signature")
        if (data !== signMessage1Data) throw NonDeterministicWalletError

        if (!isSupportedChainId(currentChainId)) {
          throw new Error("Unsupported chain")
        }
        const config = getConfigFromChainId(currentChainId)
        config.setState((x) => ({ ...x, seed: data, status: "in relayer" }))
        const id = getWalletId(config)
        setWallet(data, id)

        onOpenChange(false)
        sidebarEvents.emit("open")
      },
    },
  })

  const reset = React.useCallback(() => {
    reset1()
    reset2()
    setCurrentStep(undefined)
  }, [reset1, reset2, setCurrentStep])

  React.useEffect(() => {
    reset()
    return () => {
      reset()
    }
  }, [reset, open])

  const { switchChain } = useSwitchChain()

  const onSubmit = async () => {
    if ([signStatus1, signStatus2].some((s) => s === "error")) {
      const err = signMessage1Error || signMessage2Error
      if (isNonDeterministicWalletError((err as BaseError)?.message)) {
        reset()
        await disconnectAsync().then(() => onOpenChange(false))
        return
      }
    }
    reset()
    switchChain({ chainId: currentChainId })
    signMessage1({
      message: `${ROOT_KEY_MESSAGE_PREFIX} ${currentChainId}`,
    })
  }

  const steps: Step[] = React.useMemo(
    () => [
      {
        label: "Generate your Renegade wallet",
        status: signStatus1,
        error: (signMessage1Error as BaseError)?.shortMessage,
      },
      {
        label: "Verify wallet compatibility",
        status: signStatus2,
        error:
          (signMessage2Error as BaseError)?.shortMessage ||
          signMessage2Error?.message,
      },
    ],
    [signMessage1Error, signMessage2Error, signStatus1, signStatus2],
  )

  const isDisabled = steps.some((step) => step.status === "pending")

  const buttonText = React.useMemo(() => {
    if (isDisabled) return "Confirm in wallet"
    if (steps.some((step) => step.status === "error")) {
      const error = steps.find((step) => step.status === "error")
      if (isNonDeterministicWalletError(error?.error))
        return "Connect a new wallet"
      return "Try again"
    }
    return "Sign in to Renegade"
  }, [isDisabled, steps])

  if (isDesktop) {
    return (
      <Dialog
        open={open}
        onOpenChange={(open) => {
          reset()
          onOpenChange(open)
        }}
      >
        <DialogContent className="gap-0 p-0 sm:max-w-[425px]">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle className="font-extended">
              Sign in to Renegade
            </DialogTitle>
            <DialogDescription>
              Verify wallet ownership and compatibility before signing in.
              Signatures are free and do not send a transaction.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 p-6">
            <div className="space-y-3 border p-4">
              {getSteps(steps, currentStep)}
            </div>
            <ErrorWarning steps={steps} />
            <RememberMe />
          </div>
          <DialogFooter>
            <Button
              className="flex-1 border-x-0 border-b-0 border-t font-extended text-2xl"
              disabled={isDisabled}
              size="xl"
              variant="outline"
              onClick={onSubmit}
            >
              {buttonText}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        reset()
        onOpenChange(open)
      }}
    >
      <DialogContent className="h-dvh gap-0">
        <DialogHeader className="text-left">
          <DialogTitle>Sign in to Renegade</DialogTitle>
          <DialogDescription>
            Verify wallet ownership and compatibility before signing in.
            Signatures are free and do not send a transaction.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            className="font-extended text-lg"
            disabled={isDisabled}
            size="xl"
            onClick={onSubmit}
          >
            {buttonText}
          </Button>
          <div className="mb-6 space-y-6">
            <div className="space-y-3 border p-4">
              {getSteps(steps, currentStep)}
            </div>
            <ErrorWarning steps={steps} />
            <RememberMe />
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ErrorWarning({ steps }: { steps: Step[] }) {
  if (!steps.some((step) => step.status === "error")) return null
  return (
    <div className="flex items-center justify-center space-x-2 rounded-md bg-[#2A0000] p-3 text-sm text-red-500">
      <X className="h-4 w-4 text-red-500" />
      <div className="text-red-500">
        {steps.find((step) => step.status === "error")?.error}
      </div>
    </div>
  )
}

function RememberMe() {
  const currentChainId = useCurrentChain()
  const rememberMe = useRememberMe()
  const setRememberMe = useServerStore((s) => s.setRememberMe)

  return (
    <div className="flex items-center space-x-2">
      <Checkbox
        checked={rememberMe}
        id="remember-me"
        onCheckedChange={(checked) => {
          if (typeof checked === "boolean") {
            setRememberMe(currentChainId, checked)
          }
        }}
      />
      <Label
        className="text-muted-foreground"
        htmlFor="remember-me"
      >
        Remember me
      </Label>
    </div>
  )
}

function getSteps(steps: Step[], currentStep?: number) {
  return steps.map((step, index) => (
    <div
      key={index}
      className={cn(
        "flex items-center justify-between transition-colors hover:text-primary",
        {
          "text-muted": currentStep !== undefined && currentStep !== index,
        },
      )}
    >
      <span>
        {steps.length > 1 ? `${index + 1}. ` : ""}
        {step.label}
      </span>
      {getIcon(step.status, index, currentStep)}
    </div>
  ))
}

function getIcon(
  status: MutationStatus,
  step: number,
  currentStep: number | undefined,
) {
  if (currentStep !== undefined && step > currentStep) return null
  switch (status) {
    case "pending":
      return <Loader2 className="h-4 w-4 animate-spin" />
    case "success":
      return <Check className="h-4 w-4 text-green-500" />
    case "error":
      return <X className="h-4 w-4 text-red-500" />
    default:
      return null
  }
}
