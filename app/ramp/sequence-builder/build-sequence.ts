import { DepositStep } from "../steps/deposit-step";
import { WithdrawStep } from "../steps/withdraw-step";
import type { SequenceIntent, Step, StepExecutionContext } from "../types";
import { makeRoutingSteps, prerequisitesFor } from "./helpers";

// Error messages
const INVALID_DEPOSIT_INTENT = "Invalid intent kind for deposit steps";
const INVALID_WITHDRAW_INTENT = "Invalid intent kind for withdraw steps";
const UNSUPPORTED_INTENT = (kind: string) => `Unsupported intent kind: ${kind}`;

/**
 * Builds steps for DEPOSIT intent.
 */
async function buildDepositSteps(
    intent: SequenceIntent,
    ctx: StepExecutionContext,
): Promise<Step[]> {
    if (!intent.isDeposit()) {
        throw new Error(INVALID_DEPOSIT_INTENT);
    }
    const depositStep = new DepositStep(
        intent.toChain,
        intent.toTokenAddress(),
        intent.amountAtomic,
    );

    if (!intent.needsRouting()) {
        return [depositStep];
    }

    const routing = await makeRoutingSteps(intent, ctx);
    return [...routing, depositStep];
}

/**
 * Builds steps for WITHDRAW intent.
 */
async function buildWithdrawSteps(
    intent: SequenceIntent,
    ctx: StepExecutionContext,
): Promise<Step[]> {
    if (!intent.isWithdraw()) {
        throw new Error(INVALID_WITHDRAW_INTENT);
    }

    const withdrawStep = new WithdrawStep(
        intent.fromChain,
        intent.fromTokenAddress(),
        intent.amountAtomic,
    );

    if (!intent.needsRouting()) {
        return [withdrawStep];
    }

    const routing = await makeRoutingSteps(intent, ctx);
    return [withdrawStep, ...routing];
}

/**
 * Build an ordered sequence of transaction steps from a user intent.
 *
 * Analyzes the intent type and generates all necessary steps including
 * approvals, permit2 signatures, bridges, swaps, and deposits.
 */
export async function buildSequence(
    intent: SequenceIntent,
    ctx: StepExecutionContext,
): Promise<Step[]> {
    // Build core steps based on intent type
    let coreSteps: Step[];
    if (intent.isDeposit()) {
        coreSteps = await buildDepositSteps(intent, ctx);
    } else if (intent.isWithdraw()) {
        coreSteps = await buildWithdrawSteps(intent, ctx);
    } else {
        throw new Error(UNSUPPORTED_INTENT(intent.kind));
    }

    // Insert prerequisite steps for each core step
    const orderedSteps: Step[] = [];
    for (const step of coreSteps) {
        orderedSteps.push(...(await prerequisitesFor(step, ctx, intent)), step);
    }

    return orderedSteps;
}
