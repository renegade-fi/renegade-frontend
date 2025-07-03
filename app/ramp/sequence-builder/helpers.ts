import { ApproveStep, type BaseStep, LiFiLegStep, PayFeesStep } from "../steps";
import { requestBestRoute } from "../steps/internal/lifi";
import { Permit2Step } from "../steps/permit2-step";
import type { SequenceIntent, Step, StepExecutionContext } from "../types";
import { Prereq } from "../types";

/**
 * Build LI.FI routing leg steps for an intent when cross-chain or
 * cross-token conversion is required.
 *
 * When the intent does *not* require routing, an empty array is returned so
 * that callers can blindly spread the result without extra conditionals.
 */
export async function makeRoutingSteps(
    intent: SequenceIntent,
    ctx: StepExecutionContext,
): Promise<Step[]> {
    if (!intent.needsRouting()) return [];

    const owner = ctx.getOnchainAddress(intent.fromChain);
    const evmAddress = ctx.getEvmAddress();

    const route = await requestBestRoute({
        fromAddress: owner,
        fromAmount: intent.amountAtomic.toString(),
        fromChainId: intent.fromChain,
        fromTokenAddress: intent.fromTokenAddress(),
        toAddress: evmAddress,
        toChainId: intent.toChain,
        toTokenAddress: intent.toTokenAddress(),
    });

    const legs = route.steps ?? [];
    return legs.map((leg, idx) => {
        const isFinalLeg = idx === legs.length - 1;
        return new LiFiLegStep(leg, isFinalLeg);
    });
}

/**
 * Map prereq flag -> function that returns zero or more prerequisite steps.
 */
const prereqHandlers: Record<
    Prereq,
    (step: Step, ctx: StepExecutionContext, intent: SequenceIntent) => Promise<Step[]>
> = {
    async [Prereq.APPROVAL](step, ctx, intent) {
        const req = await step.approvalRequirement(ctx);
        if (!req) return [];
        const approve = new ApproveStep(step.chainId, step.mint, req.amount, req.spender);
        return (await approve.isNeeded(ctx, intent)) ? [approve] : [];
    },
    async [Prereq.PERMIT2](step, ctx, intent) {
        const permit = new Permit2Step(step.chainId, step.mint, step.amount);
        return (await permit.isNeeded(ctx, intent)) ? [permit] : [];
    },
    async [Prereq.PAY_FEES](_step, ctx, intent) {
        const pay = new PayFeesStep(intent.fromChain);
        return (await pay.isNeeded(ctx, intent)) ? [pay] : [];
    },
};

/**
 * Compute prerequisite steps for a core step without mutating external arrays.
 */
export async function prerequisitesFor(
    step: Step,
    ctx: StepExecutionContext,
    intent: SequenceIntent,
): Promise<Step[]> {
    const ctor = step.constructor as typeof BaseStep;
    const prereqs: Prereq[] = ctor.prereqs ?? [];
    const extras: Step[] = [];
    for (const p of prereqs) {
        extras.push(...(await prereqHandlers[p](step, ctx, intent)));
    }
    return extras;
}
