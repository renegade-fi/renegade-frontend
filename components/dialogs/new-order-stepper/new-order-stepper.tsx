'use client'

import * as React from 'react'
import { createContext, useContext, useState } from 'react'

import { useMediaQuery } from '@/hooks/use-media-query'

import { DefaultStep } from '@/components/dialogs/new-order-stepper/steps/default'
import { SuccessStep } from '@/components/dialogs/new-order-stepper/steps/success'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'

interface Props {
  base: string
  side: string
  amount: string
  clearAmount: () => void
  isUSDCDenominated?: boolean
}

export function NewOrderStepperInner({
  children,
  ...props
}: React.PropsWithChildren<Props>) {
  const { step, open, setOpen } = useStepper()
  const isDesktop = useMediaQuery('(min-width: 768px)')

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="p-0 sm:max-w-[425px]">
          {step === Step.DEFAULT && <DefaultStep {...props} />}
          {step === Step.SUCCESS && <SuccessStep {...props} />}
        </DialogContent>
      </Dialog>
    )
  }
  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger>{children}</DrawerTrigger>
      <DrawerContent>
        {step === Step.DEFAULT && <DefaultStep {...props} />}
        {step === Step.SUCCESS && <SuccessStep {...props} />}
      </DrawerContent>
    </Drawer>
  )
}

export enum Step {
  DEFAULT,
  SUCCESS,
}

const StepperContext = createContext<{
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

export const useStepper = () => useContext(StepperContext)

const StepperProvider = ({ children }: { children: React.ReactNode }) => {
  const [step, setStep] = useState(Step.DEFAULT)
  const [open, setOpen] = React.useState(false)

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
        open,
        setOpen: (open: boolean) => {
          if (open) {
            setStep(Step.DEFAULT)
          }
          setOpen(open)
        },
      }}
    >
      {children}
    </StepperContext.Provider>
  )
}

interface Props {}

export function NewOrderStepper({
  children,
  ...props
}: React.PropsWithChildren<Props>) {
  return (
    <StepperProvider>
      <NewOrderStepperInner {...props}>{children}</NewOrderStepperInner>
    </StepperProvider>
  )
}
