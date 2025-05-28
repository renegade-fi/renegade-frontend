import React from "react"

import { useConfig } from "@renegade-fi/react"
import {
  createWallet,
  getWalletFromRelayer,
  getWalletId,
  lookupWallet,
} from "@renegade-fi/react/actions"
import { ROOT_KEY_MESSAGE_PREFIX } from "@renegade-fi/react/constants"
import { MutationStatus, useMutation } from "@tanstack/react-query"
import { useModal } from "connectkit"
import { Check, Loader2, X } from "lucide-react"
import { toast } from "sonner"
import { BaseError } from "viem"
import {
  useChainId,
  useDisconnect,
  useSignMessage,
  useSwitchChain,
} from "wagmi"

import {
  ConnectSuccess,
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
import {
  CREATE_WALLET_START,
  CREATE_WALLET_SUCCESS,
  LOOKUP_WALLET_START,
  LOOKUP_WALLET_SUCCESS,
} from "@/lib/constants/toast"
import { sidebarEvents } from "@/lib/events"
import { cn } from "@/lib/utils"
import { chain } from "@/lib/viem"
import { useClientStore } from "@/providers/state-provider/client-store-provider.tsx"

export function SignInDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const currentChainId = useChainId()
  const { switchChainAsync } = useSwitchChain()
  const { disconnectAsync } = useDisconnect()
  const isDesktop = useMediaQuery("(min-width: 1024px)")
  const config = useConfig()
  const [connectLabel, setConnectLabel] = React.useState("Connect to relayer")
  const [currentStep, setCurrentStep] = React.useState<number | undefined>(
    undefined,
  )
  const { setOpen } = useModal()

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
        connectWallet({
          signature: signMessage1Data,
        })
      },
    },
  })

  const {
    mutate: connectWallet,
    status: connectStatus,
    reset: resetConnect,
    error: connectError,
  } = useMutation({
    mutationFn: async (variables: { signature: `0x${string}` }) => {
      const seed = variables.signature
      if (!config) return
      config.setState((x) => ({ ...x, seed }))
      const id = getWalletId(config)
      config.setState((x) => ({ ...x, id }))

      try {
        // GET wallet from relayer
        const wallet = await getWalletFromRelayer(config)
        // If success, return
        if (wallet) {
          config.setState((x) => ({ ...x, status: "in relayer" }))
          return ConnectSuccess.ALREADY_INDEXED
        }
      } catch (error) {}

      // GET # logs
      const blinderShare = config.utils.derive_blinder_share(seed)
      const res = await fetch(`/api/get-logs?blinderShare=${blinderShare}`)
      if (!res.ok) throw new Error("Failed to query chain")
      const { logs } = await res.json()
      // Iff logs === 0, create wallet
      if (logs === 0) {
        await createWallet(config)
        setConnectLabel(CREATE_WALLET_START)
        return ConnectSuccess.CREATE_WALLET
      } else if (logs > 0) {
        await lookupWallet(config)
        setConnectLabel(LOOKUP_WALLET_START)
        return ConnectSuccess.LOOKUP_WALLET
      }
      throw new Error("Failed to create or lookup wallet")
    },
    onMutate() {
      setCurrentStep(2)
    },
    onSuccess(data) {
      let message = ""
      if (data === ConnectSuccess.CREATE_WALLET) {
        message = CREATE_WALLET_SUCCESS
      } else if (data === ConnectSuccess.LOOKUP_WALLET) {
        message = LOOKUP_WALLET_SUCCESS
      } else if (data === ConnectSuccess.ALREADY_INDEXED) {
        message = "Successfully signed in"
      }
      toast.success(message)
      reset()
      onOpenChange(false)
      sidebarEvents.emit("open")
    },
  })

  const reset = () => {
    reset1()
    reset2()
    resetConnect()
    setCurrentStep(undefined)
  }

  const onSubmit = async () => {
    if (currentChainId !== chain.id) {
      await switchChainAsync({ chainId: chain.id })
    }
    if (steps.some((step) => step.status === "error")) {
      const error = steps.find((step) => step.status === "error")
      if (isNonDeterministicWalletError(error?.error)) {
        reset()
        await disconnectAsync().then(() => {
          onOpenChange(false)
          // setOpen(true)
        })
        return
      }
    }
    reset()
    signMessage1({
      message: `${ROOT_KEY_MESSAGE_PREFIX} ${chain.id}`,
    })
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
      {
        label: connectLabel,
        status: connectStatus,
        error: connectError?.message,
      },
    ]
  }, [
    connectError?.message,
    connectLabel,
    connectStatus,
    signMessage1Error,
    signMessage2Error,
    signStatus1,
    signStatus2,
  ])

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
  const { rememberMe, setRememberMe } = useClientStore((state) => state)

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
