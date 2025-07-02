import { zeroAddress } from "@/lib/token";
import { type BaseStep, LiFiLegStep } from "../steps";
import { ApproveStep } from "../steps/approve-step";
import { DepositStep } from "../steps/deposit-step";
import { requestBestRoute } from "../steps/internal/lifi";
import { Permit2Step } from "../steps/internal/permit2-step";
import { PayFeesStep } from "../steps/pay-fees-step";
import { WithdrawStep } from "../steps/withdraw-step";
import { getTokenByTicker } from "../token-registry";
import { Prereq, type SequenceIntent, type Step, type StepExecutionContext } from "../types";

// Error messages
const INVALID_DEPOSIT_INTENT = "Invalid intent kind for deposit steps";
const INVALID_WITHDRAW_INTENT = "Invalid intent kind for withdraw steps";
const UNSUPPORTED_INTENT = (kind: string) => `Unsupported intent kind: ${kind}`;

/**
 * Helper to fetch token address on chain; falls back to zero address.
 */
function getTokenAddress(ticker: string, chainId: number): `0x${string}` {
    const token = getTokenByTicker(ticker, chainId);
    return token?.address ?? (zeroAddress as `0x${string}`);
}

/**
 * Builds steps for DEPOSIT intent.
 * If routing is required (token or chain mismatch), we call LI.FI to find the best route
 * and convert each leg into executable steps. Finally, we append the Renegade DepositStep.
 */
async function buildDepositSteps(
    intent: SequenceIntent,
    ctx: StepExecutionContext,
): Promise<Step[]> {
    if (intent.kind !== "DEPOSIT") {
        throw new Error(INVALID_DEPOSIT_INTENT);
    }
    const ordered: Step[] = [];

    // Determine if routing is required (token or chain mismatch)
    const sourceTicker = intent.fromTicker ?? intent.toTicker;
    const needsRouting = intent.fromChain !== intent.toChain || sourceTicker !== intent.toTicker;

    if (needsRouting) {
        const owner = ctx.getWagmiAddress();
        const fromAddress = getTokenAddress(sourceTicker, intent.fromChain);
        const toAddress = getTokenAddress(intent.toTicker, intent.toChain);

        const route = await requestBestRoute({
            fromChainId: intent.fromChain,
            toChainId: intent.toChain,
            fromTokenAddress: fromAddress,
            toTokenAddress: toAddress,
            fromAmount: intent.amountAtomic.toString(),
            fromAddress: owner,
        });

        const lifiSteps = route.steps?.map((leg) => new LiFiLegStep(leg)) ?? [];
        ordered.push(...lifiSteps);
    }

    // Append the Renegade deposit step
    ordered.push(
        new DepositStep(
            intent.toChain,
            getTokenAddress(intent.toTicker, intent.toChain),
            intent.amountAtomic,
        ),
    );

    return ordered;
}

/**
 * Builds steps for WITHDRAW intent.
 */
function buildWithdrawSteps(intent: SequenceIntent): Step[] {
    if (intent.kind !== "WITHDRAW") {
        throw new Error(INVALID_WITHDRAW_INTENT);
    }

    return [
        new WithdrawStep(
            intent.fromChain,
            getTokenAddress(intent.toTicker, intent.fromChain),
            intent.amountAtomic,
        ),
    ];
}

// -------------------- Prerequisite Framework --------------------

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

async function addPrerequisites(
    step: Step,
    ctx: StepExecutionContext,
    intent: SequenceIntent,
    out: Step[],
) {
    const ctor = step.constructor as typeof BaseStep;
    const prereqs: Prereq[] = ctor.prereqs ?? [];
    for (const p of prereqs) {
        const extras = await prereqHandlers[p](step, ctx, intent);
        out.push(...extras);
    }
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
    if (intent.kind === "DEPOSIT") {
        coreSteps = await buildDepositSteps(intent, ctx);
    } else if (intent.kind === "WITHDRAW") {
        coreSteps = buildWithdrawSteps(intent);
    } else {
        throw new Error(UNSUPPORTED_INTENT(intent.kind));
    }

    // Insert prerequisite steps for each core step
    const orderedSteps: Step[] = [];
    for (const step of coreSteps) {
        await addPrerequisites(step, ctx, intent, orderedSteps);
        orderedSteps.push(step);
    }

    return orderedSteps;
}
