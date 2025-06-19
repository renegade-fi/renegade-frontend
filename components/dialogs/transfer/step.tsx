import type { TaskState } from "@renegade-fi/react";
import type { Token } from "@renegade-fi/token-nextjs";
import type { MutationStatus } from "@tanstack/react-query";
import { Check, ExternalLink, Loader2, X } from "lucide-react";
import type React from "react";

import { AnimatedEllipsis } from "@/app/components/animated-ellipsis";

import { getExplorerLink } from "@/components/dialogs/transfer/helpers";
import { Button } from "@/components/ui/button";

import { TASK_STATES } from "@/lib/constants/protocol";
import { formatTaskState } from "@/lib/constants/task";
import { cn } from "@/lib/utils";

function StepIcon({
    isPending,
    isSuccess,
    isError,
}: {
    isPending: boolean;
    isSuccess: boolean;
    isError: boolean;
}) {
    if (isPending) {
        return <Loader2 className="h-4 w-4 animate-spin" />;
    }
    if (isSuccess) {
        return <Check className="h-4 w-4 text-green-price" />;
    }
    if (isError) {
        return <X className="h-4 w-4 text-red-price" />;
    }
    return null;
}

export function getSteps(execution: Execution, currentStep: number) {
    return execution.steps.map((step, i) => {
        if (!step || !execution.token) return null;
        if (step.type === "transaction") {
            return (
                <TransactionStep
                    key={i}
                    currentStep={currentStep}
                    index={i}
                    step={step}
                    stepCount={execution.steps.length}
                    token={execution.token}
                />
            );
        } else if (step.type === "task") {
            return (
                <TaskStep
                    key={i}
                    currentStep={currentStep}
                    index={i}
                    step={step}
                    stepCount={execution.steps.length}
                    token={execution.token}
                />
            );
        } else if (step.type === "lifi") {
            return (
                <LiFiStep
                    key={i}
                    currentStep={currentStep}
                    index={i}
                    step={step}
                    stepCount={execution.steps.length}
                    token={execution.token}
                />
            );
        }
        return null;
    });
}

export type Execution = {
    steps: (Step | undefined)[];
    token?: InstanceType<typeof Token>;
};

type StepBase = {
    type: "transaction" | "task" | "lifi";
    label: string;
    txHash?: `0x${string}`;
    txStatus?: "pending" | "success" | "error";
    chainId?: number;
    mutationStatus?: MutationStatus;
};

interface TransactionStep extends StepBase {
    type: "transaction";
    txHash?: `0x${string}`;
    mutationStatus: MutationStatus;
    txStatus?: "pending" | "success" | "error";
}

interface TaskStep extends StepBase {
    type: "task";
    taskStatus?: TaskState;
    mutationStatus: MutationStatus;
}

interface LiFiStep extends StepBase {
    type: "lifi";
    lifiExplorerLink?: string;
}

export type Step = TransactionStep | TaskStep | LiFiStep;

type StepProps<T extends Step> = {
    currentStep: number;
    index: number;
    step: T;
    token: InstanceType<typeof Token>;
    stepCount: number;
};

const StepStatus: React.FC<{
    isPending: boolean;
    isSuccess: boolean;
    isCurrentStep: boolean;
    link?: string;
    pendingText?: string;
    successText?: string;
}> = ({
    isPending,
    isSuccess,
    isCurrentStep,
    link,
    pendingText = "Confirming",
    successText = "Confirmed",
}) => {
    const content = (
        <>
            {isPending ? (
                <>
                    {pendingText}
                    <AnimatedEllipsis />
                </>
            ) : (
                <>
                    {successText}
                    {link && <ExternalLink className="ml-1 h-3 w-3" />}
                </>
            )}
        </>
    );

    return (
        <span className="whitespace-nowrap transition-colors group-hover:text-primary">
            └─&nbsp;
            {link ? (
                <Button
                    asChild
                    className={cn("h-4 p-0 text-base group-hover:text-primary", {
                        "text-muted": !isCurrentStep,
                    })}
                    type="button"
                    variant="link"
                >
                    <a href={link} rel="noopener noreferrer" target="_blank">
                        {content}
                    </a>
                </Button>
            ) : (
                <span className={cn("text-base", { "text-muted": !isCurrentStep })}>{content}</span>
            )}
        </span>
    );
};

type BaseStepProps = {
    currentStep: number;
    index: number;
    stepCount: number;
    token: InstanceType<typeof Token>;
};

function BaseStep({
    currentStep,
    index,
    step,
    status,
    statusComponent,
    stepCount,
}: BaseStepProps & {
    step: Step;
    status: {
        isPending: boolean;
        isSuccess: boolean;
        isError: boolean;
    };
    statusComponent: React.ReactNode;
}) {
    const isCurrentStep = currentStep === index;

    return (
        <div
            className={cn("", {
                "text-muted": !isCurrentStep,
                group: currentStep > index,
            })}
        >
            <div className="flex items-center justify-between transition-colors group-hover:text-primary">
                <span>
                    {stepCount > 1 ? `${index + 1}. ` : ""}
                    {step.label}
                </span>
                <StepIcon
                    isError={status.isError}
                    isPending={status.isPending && isCurrentStep}
                    isSuccess={status.isSuccess}
                />
            </div>
            {statusComponent}
        </div>
    );
}

export function LiFiStep(props: StepProps<LiFiStep>) {
    const { currentStep, index, step } = props;
    const isCurrentStep = currentStep === index;
    const status = {
        isPending: step.txStatus === "pending" || isCurrentStep,
        isSuccess: step.txStatus === "success",
        isError: step.txStatus === "error",
    };

    const statusComponent = (
        <StepStatus
            isCurrentStep={isCurrentStep}
            isPending={status.isPending}
            isSuccess={status.isSuccess}
            link={step.txHash ? getExplorerLink(step.txHash, step.chainId) : step.lifiExplorerLink}
        />
    );

    return (
        <BaseStep
            {...props}
            status={status}
            statusComponent={status.isPending || status.isSuccess ? statusComponent : null}
        />
    );
}

export function TransactionStep(props: StepProps<TransactionStep>) {
    const { currentStep, index, step } = props;
    const isCurrentStep = currentStep === index;
    const status = {
        isPending: Boolean(
            step.mutationStatus === "pending" || (step.txHash && step.txStatus === "pending"),
        ),
        isSuccess: Boolean(
            step.mutationStatus === "success" || (step.txHash && step.txStatus === "success"),
        ),
        isError: Boolean(
            step.mutationStatus === "error" || (step.txHash && step.txStatus === "error"),
        ),
    };

    const statusComponent = (
        <StepStatus
            isCurrentStep={isCurrentStep}
            isPending={status.isPending}
            isSuccess={status.isSuccess}
            link={step.txHash ? getExplorerLink(step.txHash, step.chainId) : undefined}
        />
    );

    return (
        <BaseStep
            {...props}
            status={status}
            statusComponent={status.isPending || status.isSuccess ? statusComponent : null}
        />
    );
}

export function TaskStep(props: StepProps<TaskStep>) {
    const { currentStep, index, step } = props;
    const isCurrentStep = currentStep === index;
    const status = {
        isPending: Boolean(
            step.mutationStatus === "pending" ||
                (step.taskStatus &&
                    step.taskStatus !== "Completed" &&
                    step.taskStatus !== "Failed"),
        ),
        isSuccess: step.taskStatus === "Completed",
        isError: step.taskStatus === "Failed" || step.mutationStatus === "error",
    };

    const statusComponent = (
        <div className="text-muted">
            {TASK_STATES.map((state) => (
                <div
                    key={state}
                    className={cn("transition-colors hover:text-primary", {
                        "text-primary": step.taskStatus === state && isCurrentStep,
                    })}
                >
                    {`${state === "Completed" || state === "Failed" ? "└─" : "├─"} ${formatTaskState(state)}`}
                </div>
            ))}
        </div>
    );

    return (
        <BaseStep
            {...props}
            status={status}
            statusComponent={currentStep >= index ? statusComponent : null}
        />
    );
}
