import {
  Fade,
  Modal,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
} from "@chakra-ui/react"
import React, { createContext, useContext, useState } from "react"

import { DefaultStep } from "@/components/steppers/create-stepper/steps/default-step"
import { LoadingStep } from "@/components/steppers/create-stepper/steps/loading-step"

const CreateStepperInner = () => {
  const { step, onClose } = useStepper()

  return (
    <Modal isCentered isOpen onClose={onClose} size="sm">
      <ModalOverlay
        background="rgba(0, 0, 0, 0.25)"
        backdropFilter="blur(8px)"
      />
      <ModalContent height="228px" background="surfaces.1" borderRadius="10">
        {step === Step.DEFAULT && (
          <ModalHeader paddingBottom="0">Unlock your Wallet</ModalHeader>
        )}
        <ModalCloseButton />
        <Fade
          transition={{ enter: { duration: 0.25 } }}
          in={step === Step.DEFAULT}
        >
          {step === Step.DEFAULT && <DefaultStep />}
        </Fade>
        <Fade
          transition={{ enter: { duration: 0.25 } }}
          in={step === Step.LOADING}
        >
          {step === Step.LOADING && <LoadingStep />}
        </Fade>
      </ModalContent>
    </Modal>
  )
}

export enum Step {
  DEFAULT,
  LOADING,
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

export function CreateStepper({ onClose }: { onClose: () => void }) {
  return (
    <StepperProvider onClose={onClose}>
      <CreateStepperInner />
    </StepperProvider>
  )
}
