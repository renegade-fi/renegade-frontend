import * as React from "react"

import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

import { NewOrderFormProps } from "@/app/trade/[base]/components/new-order/new-order-form"

import { DefaultStep } from "@/components/dialogs/order-stepper/desktop/steps/default"
import { SuccessStepWithoutSavings } from "@/components/dialogs/order-stepper/desktop/steps/success-without-savings"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export interface NewOrderConfirmationProps extends NewOrderFormProps {
  onSuccess?: () => void
  predictedSavings: number
  relayerFee: number
  protocolFee: number
}

export function NewOrderStepperInner({
  children,
  ...props
}: React.PropsWithChildren<NewOrderConfirmationProps>) {
  const { step, open, setOpen } = useStepper()
  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        className="gap-0 p-0 sm:max-w-[425px]"
        onOpenAutoFocus={(e) => {
          e.preventDefault()
        }}
      >
        {step === Step.DEFAULT && <DefaultStep {...props} />}
        {step === Step.SUCCESS && <SuccessStepWithoutSavings />}
      </DialogContent>
    </Dialog>
  )
}

export enum Step {
  DEFAULT,
  SUCCESS,
}

const StepperContext = React.createContext<{
  onBack: () => void
  onNext: () => void
  setStep: (step: Step) => void
  step: Step
  open: boolean
  setOpen: (open: boolean) => void
  taskId: string
  setTaskId: (taskId: string) => void
}>({
  onBack: () => {},
  onNext: () => {},
  setStep: () => {},
  step: Step.DEFAULT,
  open: false,
  setOpen: () => {},
  taskId: "",
  setTaskId: () => {},
})

export const useStepper = () => React.useContext(StepperContext)

const StepperProvider = ({
  children,
  open,
  setOpen,
}: {
  children: React.ReactNode
  open: boolean
  setOpen: (open: boolean) => void
}) => {
  const [step, setStep] = React.useState(Step.DEFAULT)
  const [taskId, setTaskId] = React.useState("")

  const handleNext = () => {
    setStep(step + 1)
  }

  const handleBack = () => {
    setStep(step - 1)
  }

  React.useEffect(() => {
    if (open) {
      setStep(Step.DEFAULT)
      setTaskId("")
    }
  }, [open])

  return (
    <StepperContext.Provider
      value={{
        onBack: handleBack,
        onNext: handleNext,
        setStep,
        step,
        open,
        setOpen,
        taskId,
        setTaskId,
      }}
    >
      {children}
    </StepperContext.Provider>
  )
}

export function NewOrderStepper({
  children,
  open,
  setOpen,
  ...props
}: React.PropsWithChildren<
  NewOrderConfirmationProps & {
    open: boolean
    setOpen: (open: boolean) => void
  }
>) {
  return (
    <StepperProvider
      open={open}
      setOpen={setOpen}
    >
      <NewOrderStepperInner {...props}>{children}</NewOrderStepperInner>
    </StepperProvider>
  )
}
