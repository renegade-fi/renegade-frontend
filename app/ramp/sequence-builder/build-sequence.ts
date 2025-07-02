import { erc20Abi } from "@/lib/generated";
import { zeroAddress } from "@/lib/token";
import type { BaseStep } from "../steps";
import { ApproveStep } from "../steps/approve-step";
import { BridgeStep } from "../steps/bridge-step";
import { DepositStep } from "../steps/deposit-step";
import { Permit2Step } from "../steps/internal/permit2-step";
import { SwapStep } from "../steps/swap-step";
import { WithdrawStep } from "../steps/withdraw-step";
import { getTokenByTicker } from "../token-registry";
import type { SequenceIntent, Step, StepExecutionContext } from "../types";

// Error messages
const INVALID_SWAP_INTENT = "Invalid intent kind for swap steps";
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
 * Builds steps for SWAP intent.
 */
function buildSwapSteps(intent: SequenceIntent): Step[] {
    if (intent.kind !== "SWAP") {
        throw new Error(INVALID_SWAP_INTENT);
    }

    const fromAddress = getTokenAddress(intent.fromTicker!, intent.fromChain);
    const toAddress = getTokenAddress(intent.toTicker, intent.toChain);

    return [
        new SwapStep(intent.fromChain, intent.toChain, fromAddress, toAddress, intent.amountAtomic),
        new DepositStep(intent.toChain, toAddress, intent.amountAtomic),
    ];
}

/**
 * Builds steps for DEPOSIT intent.
 */
function buildDepositSteps(intent: SequenceIntent): Step[] {
    if (intent.kind !== "DEPOSIT") {
        throw new Error(INVALID_DEPOSIT_INTENT);
    }

    const steps: Step[] = [];

    // Add bridge step if chains differ
    const needsBridge = intent.fromChain !== intent.toChain;
    if (needsBridge) {
        steps.push(
            new BridgeStep(
                intent.fromChain,
                intent.toChain,
                getTokenAddress(intent.toTicker, intent.fromChain),
                getTokenAddress(intent.toTicker, intent.toChain),
                intent.amountAtomic,
            ),
        );
    }

    // Always add deposit step
    steps.push(
        new DepositStep(
            intent.toChain,
            getTokenAddress(intent.toTicker, intent.toChain),
            intent.amountAtomic,
        ),
    );

    return steps;
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

/**
 * Checks if approval is needed and adds approval step if required.
 */
async function checkAndAddApprovalStep(
    step: Step,
    ctx: StepExecutionContext,
): Promise<Step | null> {
    let approvalReq;
    try {
        approvalReq = await step.approvalRequirement(ctx);
    } catch {
        // If approval requirement check fails, proceed without approval step
        return null;
    }

    if (!approvalReq) {
        return null;
    }

    const owner = ctx.getWagmiAddress();
    if (!owner) {
        // No owner available, assume approval needed (conservative approach)
        return new ApproveStep(step.chainId, step.mint, approvalReq.amount, approvalReq.spender);
    }

    try {
        const publicClient = ctx.getPublicClient(step.chainId);
        const allowance: bigint = await publicClient.readContract({
            abi: erc20Abi,
            address: step.mint,
            functionName: "allowance",
            args: [owner, approvalReq.spender],
        });

        const needsApproval = allowance < approvalReq.amount;
        if (!needsApproval) {
            return null;
        }

        return new ApproveStep(step.chainId, step.mint, approvalReq.amount, approvalReq.spender);
    } catch {
        // If allowance check fails, assume approval needed (conservative approach)
        return new ApproveStep(step.chainId, step.mint, approvalReq.amount, approvalReq.spender);
    }
}

/**
 * Adds all prerequisite steps (approval and permit2) for a given step.
 */
async function addPrerequisiteSteps(
    step: Step,
    ctx: StepExecutionContext,
    ordered: Step[],
): Promise<void> {
    // Add approval step if needed
    const approvalStep = await checkAndAddApprovalStep(step, ctx);
    if (approvalStep) {
        ordered.push(approvalStep);
    }

    // Add permit2 step if needed
    const stepConstructor = step.constructor as typeof BaseStep;
    if (stepConstructor.needsPermit2) {
        ordered.push(new Permit2Step(step.chainId, step.mint, step.amount));
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
    if (intent.kind === "SWAP") {
        coreSteps = buildSwapSteps(intent);
    } else if (intent.kind === "DEPOSIT") {
        coreSteps = buildDepositSteps(intent);
    } else if (intent.kind === "WITHDRAW") {
        coreSteps = buildWithdrawSteps(intent);
    } else {
        throw new Error(UNSUPPORTED_INTENT(intent.kind));
    }

    // Insert prerequisite steps for each core step
    const orderedSteps: Step[] = [];
    for (const step of coreSteps) {
        await addPrerequisiteSteps(step, ctx, orderedSteps);
        orderedSteps.push(step);
    }

    return orderedSteps;
}
