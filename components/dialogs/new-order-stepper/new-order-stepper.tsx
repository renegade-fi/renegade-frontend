import * as React from "react"

import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { Token } from "@renegade-fi/react"

import { NewOrderFormProps } from "@/app/trade/[base]/components/new-order/new-order-form"

import { DefaultStep } from "@/components/dialogs/new-order-stepper/steps/default"
import { SuccessStep } from "@/components/dialogs/new-order-stepper/steps/success"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer"

import { useMediaQuery } from "@/hooks/use-media-query"
import { usePrice } from "@/stores/price-store"

export interface NewOrderProps extends NewOrderFormProps {
  onSuccess?: () => void
  predictedSavings: number
  relayerFee: number
  protocolFee: number
}

export function NewOrderStepperInner({
  children,
  ...props
}: React.PropsWithChildren<NewOrderProps>) {
  const { step, open, setOpen } = useStepper()
  const isDesktop = useMediaQuery("(min-width: 768px)")

  const { amount, isUSDCDenominated, base } = props
  const price = usePrice({
    baseAddress: Token.findByTicker(base).address,
  })
  let baseAmount = amount
  if (isUSDCDenominated && price) {
    // TODO: [SAFETY]: Check if amount is a number
    baseAmount = Number(amount) / price
  }

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogHeader className="sr-only">
          <VisuallyHidden>
            <DialogTitle className="font-extended">Review Order</DialogTitle>
            <DialogDescription>
              Review your order before placing it.
            </DialogDescription>
          </VisuallyHidden>
        </DialogHeader>
        <DialogContent
          className="p-0 sm:max-w-[425px]"
          onOpenAutoFocus={e => {
            e.preventDefault()
          }}
        >
          {step === Step.DEFAULT && (
            <DefaultStep {...props} amount={baseAmount} />
          )}
          {step === Step.SUCCESS && (
            <SuccessStep {...props} amount={baseAmount} />
          )}
        </DialogContent>
      </Dialog>
    )
  }
  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent>
        {step === Step.DEFAULT && (
          <DefaultStep {...props} amount={baseAmount} />
        )}
        {step === Step.SUCCESS && (
          <SuccessStep {...props} amount={baseAmount} />
        )}
      </DrawerContent>
    </Drawer>
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
}>({
  onBack: () => {},
  onNext: () => {},
  setStep: () => {},
  step: Step.DEFAULT,
  open: false,
  setOpen: () => {},
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

  const handleNext = () => {
    setStep(step + 1)
  }

  const handleBack = () => {
    setStep(step - 1)
  }

  React.useEffect(() => {
    if (open) {
      setStep(Step.DEFAULT)
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
  NewOrderProps & { open: boolean; setOpen: (open: boolean) => void }
>) {
  return (
    <StepperProvider open={open} setOpen={setOpen}>
      <NewOrderStepperInner {...props}>{children}</NewOrderStepperInner>
    </StepperProvider>
  )
}
