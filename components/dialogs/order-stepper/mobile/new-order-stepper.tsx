import * as React from "react"

import { NewOrderConfirmationProps } from "@/components/dialogs/order-stepper/desktop/new-order-stepper"
import { ConfirmStep } from "@/components/dialogs/order-stepper/mobile/steps/confirm"
import { DefaultStep } from "@/components/dialogs/order-stepper/mobile/steps/default"
import { SuccessStepWithoutSavings } from "@/components/dialogs/order-stepper/mobile/steps/success-without-savings"
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer"

export function NewOrderStepperInner({
  children,
  ...props
}: React.PropsWithChildren<{
  base: string
  isUSDCDenominated?: boolean
}>) {
  const { step, onNext, setStep, setTaskId } = useStepper()
  const [lockedFormValues, setLockedFormValues] =
    React.useState<NewOrderConfirmationProps | null>(null)
  const handleSubmit = (values: NewOrderConfirmationProps) => {
    setLockedFormValues(values)
    onNext()
  }

  return (
    <Drawer
      scrollLockTimeout={0}
      onOpenChange={() => {
        setLockedFormValues(null)
        setStep(Step.DEFAULT)
        setTaskId("")
      }}
    >
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent className="max-h-[90dvh]">
        <div className="overflow-auto">
          {step === Step.DEFAULT && (
            <DefaultStep
              {...props}
              onSubmit={handleSubmit}
            />
          )}
          {step === Step.CONFIRM && lockedFormValues && (
            <ConfirmStep {...lockedFormValues} />
          )}
          {step === Step.SUCCESS && <SuccessStepWithoutSavings />}
        </div>
      </DrawerContent>
    </Drawer>
  )
}

export enum Step {
  DEFAULT,
  CONFIRM,
  SUCCESS,
}

const StepperContext = React.createContext<{
  onBack: () => void
  onNext: () => void
  setStep: (step: Step) => void
  step: Step
  taskId: string
  setTaskId: (taskId: string) => void
}>({
  onBack: () => {},
  onNext: () => {},
  setStep: () => {},
  step: Step.DEFAULT,
  taskId: "",
  setTaskId: () => {},
})

export const useStepper = () => React.useContext(StepperContext)

const StepperProvider = ({ children }: { children: React.ReactNode }) => {
  const [step, setStep] = React.useState(Step.DEFAULT)
  const [taskId, setTaskId] = React.useState("")

  const handleNext = () => {
    setStep(step + 1)
  }

  const handleBack = () => {
    setStep(step - 1)
  }

  return (
    <StepperContext.Provider
      value={{
        onBack: handleBack,
        onNext: handleNext,
        setStep,
        step,
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
  ...props
}: React.PropsWithChildren<{
  base: string
  isUSDCDenominated?: boolean
}>) {
  return (
    <StepperProvider>
      <NewOrderStepperInner {...props}>{children}</NewOrderStepperInner>
    </StepperProvider>
  )
}
