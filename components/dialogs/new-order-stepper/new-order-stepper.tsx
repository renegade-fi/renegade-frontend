'use client'

import { createContext, useContext, useState } from 'react'

export function NewOrderStepperInner() {
  const { step, onClose } = useStepper()
  return <div>NewOrderStepper</div>
}

export enum Step {
  DEFAULT,
  SUCCESS,
}

const StepperContext = createContext<{
  onBack: () => void
  onClose: () => void
  onNext: () => void
  setStep: (step: Step) => void
  step: Step
}>({
  onBack: () => {},
  onClose: () => {},
  onNext: () => {},
  setStep: () => {},
  step: Step.DEFAULT,
})

export const useStepper = () => useContext(StepperContext)

const StepperProvider = ({
  children,
  onClose,
}: {
  children: React.ReactNode
  onClose: () => void
}) => {
  const [step, setStep] = useState(Step.DEFAULT)

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
        onClose,
        onNext: handleNext,
        setStep,
        step,
      }}
    >
      {children}
    </StepperContext.Provider>
  )
}

export function NewOrderStepper({ onClose }: { onClose: () => void }) {
  return (
    <StepperProvider onClose={onClose}>
      <NewOrderStepperInner />
    </StepperProvider>
  )
}
