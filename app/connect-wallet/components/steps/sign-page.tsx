import React from "react"

import { ROOT_KEY_MESSAGE_PREFIX } from "@renegade-fi/react/constants"
import { MutationStatus } from "@tanstack/react-query"
import { Check, Loader2, X } from "lucide-react"
import { useLocalStorage } from "usehooks-ts"

import { useWagmiMutation } from "@/app/connect-wallet/context/wagmi-mutation-context"

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

type Step = {
  label: string
  status: MutationStatus
  error?: string | null
}

export function SignMessagesPage() {
  const {
    resetMutations,
    signMessage1,
    signMessage1Status,
    signMessage2Status,
    error,
    setError,
  } = useWagmiMutation()
  const [currentStep, setCurrentStep] = React.useState<number | undefined>(
    undefined,
  )
  console.log("🚀 ~ SignMessagesPage ~ currentStep:", currentStep)

  const reset = () => {
    resetMutations()
    setCurrentStep(undefined)
    setError(null)
  }

  const onSubmit = async () => {
    if (steps.some((step) => step.status === "error")) {
      reset()
    }
    setCurrentStep(0)
    signMessage1(
      { message: `${ROOT_KEY_MESSAGE_PREFIX} ${chain.id}` },
      {
        onSuccess() {
          setCurrentStep(1)
        },
      },
    )
  }

  const steps = React.useMemo(() => {
    return [
      {
        label: "Generate your Renegade wallet",
        status: signMessage1Status,
        error,
      },
      {
        label: "Verify wallet compatibility",
        status: signMessage2Status,
        error,
      },
    ]
  }, [currentStep, error, signMessage1Status, signMessage2Status])
  console.log(steps.map((step) => step.status))

  const isDisabled = steps.some((step) => step.status === "pending")

  const buttonText = React.useMemo(() => {
    if (isDisabled) return "Confirm in wallet"
    if (steps.some((step) => step.status === "error")) {
      return "Try again"
    }
    return "Sign message"
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
    </>
  )
}

function RememberMe() {
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
