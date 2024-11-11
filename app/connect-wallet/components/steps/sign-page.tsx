import React from "react"

import { useConfig } from "@renegade-fi/react"
import { getWalletFromRelayer, getWalletId } from "@renegade-fi/react/actions"
import { ROOT_KEY_MESSAGE_PREFIX } from "@renegade-fi/react/constants"
import { MutationStatus } from "@tanstack/react-query"
import { Check, Loader2, X } from "lucide-react"
import { useLocalStorage } from "usehooks-ts"
import { BaseError } from "viem"
import { useSignMessage } from "wagmi"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

import { STORAGE_REMEMBER_ME } from "@/lib/constants/storage"
import { cn } from "@/lib/utils"
import { chain } from "@/lib/viem"

import { useWalletOnboarding } from "../../context/wallet-onboarding-context"

type Step = {
  label: string
  status: MutationStatus
  error?: string
}

export function SignMessagesPage() {
  const { setStep, setError } = useWalletOnboarding()
  const [currentStep, setCurrentStep] = React.useState<number | undefined>(
    undefined,
  )
  const config = useConfig()

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
          message: `${ROOT_KEY_MESSAGE_PREFIX} ${chain.id}`,
        })
      },
      onError(error) {
        setError(error.message)
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
      async onSuccess(data) {
        if (!data || !signMessage1Data) {
          setError("Missing signature")
          return
        }
        if (data !== signMessage1Data) {
          setError(
            "Signatures do not match. Please try again with a different wallet.",
          )
          return
        }
        const seed = data
        config.setState((x) => ({ ...x, seed }))
        const id = getWalletId(config)
        config.setState((x) => ({ ...x, id }))

        // Check if wallet exists in relayer
        try {
          const wallet = await getWalletFromRelayer(config)
          if (wallet) {
            // Wallet exists, no processing needed
            config.setState((x) => ({ ...x, status: "in relayer" }))
            setStep("COMPLETION")
          } else {
            // Wallet needs processing
            setStep("PROCESSING")
          }
        } catch (error) {
          // If fetch fails, assume processing is needed
          setStep("PROCESSING")
        }
      },
      onError(error) {
        setError(error.message)
      },
    },
  })

  const reset = () => {
    reset1()
    reset2()
    setCurrentStep(undefined)
    setError(null)
  }

  const onSubmit = async () => {
    if (steps.some((step) => step.status === "error")) {
      reset()
    }
    signMessage1({ message: `${ROOT_KEY_MESSAGE_PREFIX} ${chain.id}` })
  }

  const steps = React.useMemo(() => {
    return [
      {
        label: "Generate your Renegade wallet",
        status: signStatus1,
        error: (signMessage1Error as BaseError)?.shortMessage,
      },
      {
        label: "Verify wallet compatibility",
        status: signStatus2,
        error:
          (signMessage2Error as BaseError)?.shortMessage ??
          signMessage2Error?.message,
      },
    ]
  }, [signMessage1Error, signMessage2Error, signStatus1, signStatus2])

  const isDisabled = steps.some((step) => step.status === "pending")

  const buttonText = React.useMemo(() => {
    if (isDisabled) return "Confirm in wallet"
    if (steps.some((step) => step.status === "error")) {
      return "Try again"
    }
    return "Sign messages"
  }, [isDisabled, steps])

  return (
    <>
      <DialogHeader className="px-6 pt-6">
        <DialogTitle>Sign Messages</DialogTitle>
        <DialogDescription>
          Verify wallet ownership and compatibility. Signatures are free and do
          not send a transaction.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-6 p-6">
        <div className="space-y-3 border p-4">
          {steps.map((step, index) => (
            <div
              key={index}
              className={cn(
                "flex items-center justify-between transition-colors hover:text-primary",
                {
                  "text-muted":
                    currentStep !== undefined && currentStep !== index,
                },
              )}
            >
              <span>
                {steps.length > 1 ? `${index + 1}. ` : ""}
                {step.label}
              </span>
              {getStepIcon(step.status, index, currentStep)}
            </div>
          ))}
        </div>
        <ErrorWarning steps={steps} />
        <SignInContent />
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
    </>
  )
}

function SignInContent() {
  const [rememberMe, setRememberMe] = useLocalStorage(
    STORAGE_REMEMBER_ME,
    false,
    {
      initializeWithValue: false,
    },
  )

  return (
    <div className="flex items-center space-x-2">
      <Checkbox
        checked={rememberMe}
        id="remember-me"
        onCheckedChange={(checked) => {
          if (typeof checked === "boolean") {
            setRememberMe(checked)
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

function getStepIcon(
  status: "idle" | "pending" | "success" | "error",
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
