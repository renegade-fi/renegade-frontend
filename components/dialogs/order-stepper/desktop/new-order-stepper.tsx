import * as React from "react";

import type { NewOrderFormProps } from "@/app/trade/[base]/components/new-order/new-order-form";

import { DefaultStep } from "@/components/dialogs/order-stepper/desktop/steps/default";
import { SuccessStepWithoutSavings } from "@/components/dialogs/order-stepper/desktop/steps/success-without-savings";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

export interface NewOrderConfirmationProps extends NewOrderFormProps {
    onSuccess?: () => void;
    predictedSavingsBps: number;
    predictedSavings: number;
    relayerFee: number;
    protocolFee: number;
}

function NewOrderStepperInner({
    children,
    ...props
}: React.PropsWithChildren<NewOrderConfirmationProps>) {
    const { step, open, setOpen } = useStepper();
    return (
        <Dialog onOpenChange={setOpen} open={open}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent
                className="max-w-none border-none bg-transparent p-0 sm:max-w-[425px]"
                onOpenAutoFocus={(e) => {
                    e.preventDefault();
                }}
            >
                <div className="flex gap-4">
                    <div className="min-w-[425px] flex-1 border bg-background">
                        {step === Step.DEFAULT && <DefaultStep {...props} />}
                        {step === Step.SUCCESS && <SuccessStepWithoutSavings />}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

enum Step {
    DEFAULT,
    SUCCESS,
}

const StepperContext = React.createContext<{
    onBack: () => void;
    onNext: () => void;
    setStep: (step: Step) => void;
    step: Step;
    open: boolean;
    setOpen: (open: boolean) => void;
    taskId: string;
    setTaskId: (taskId: string) => void;
}>({
    onBack: () => {},
    onNext: () => {},
    setStep: () => {},
    step: Step.DEFAULT,
    open: false,
    setOpen: () => {},
    taskId: "",
    setTaskId: () => {},
});

export const useStepper = () => React.useContext(StepperContext);

const StepperProvider = ({
    children,
    open,
    setOpen,
}: {
    children: React.ReactNode;
    open: boolean;
    setOpen: (open: boolean) => void;
}) => {
    const [step, setStep] = React.useState(Step.DEFAULT);
    const [taskId, setTaskId] = React.useState("");

    const handleNext = () => {
        setStep(step + 1);
    };

    const handleBack = () => {
        setStep(step - 1);
    };

    React.useEffect(() => {
        if (open) {
            setStep(Step.DEFAULT);
            setTaskId("");
        }
    }, [open]);

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
    );
};

export function NewOrderStepper({
    children,
    open,
    setOpen,
    ...props
}: React.PropsWithChildren<
    NewOrderConfirmationProps & {
        open: boolean;
        setOpen: (open: boolean) => void;
    }
>) {
    return (
        <StepperProvider open={open} setOpen={setOpen}>
            <NewOrderStepperInner {...props}>{children}</NewOrderStepperInner>
        </StepperProvider>
    );
}
