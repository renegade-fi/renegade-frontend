import type { Route } from "@lifi/sdk";
import type { Step, StepExecutionContext } from "../../types";
import { ApproveStep } from "../approve-step";
import { LiFiLegStep } from "../lifi-leg-step";

interface ApprovalKey {
    chainId: number;
    token: string;
    spender: string;
}

function approvalKey({ chainId, token, spender }: ApprovalKey): string {
    return `${chainId}:${token.toLowerCase()}:${spender.toLowerCase()}`;
}

/**
 * Builds an ordered list of prerequisite ApproveSteps and LiFiLegSteps
 * for every leg in a LI.FI route. Duplicate approvals are deduplicated.
 */
export async function buildStepsFromLiFiRoute(
    route: Route,
    ctx: StepExecutionContext,
): Promise<Step[]> {
    const ordered: Step[] = [];

    // Track approvals already added to avoid duplicates across legs.
    const seenApprovals = new Set<string>();

    for (const leg of route.steps ?? []) {
        const legStep = new LiFiLegStep(leg);

        // Determine approval requirement
        const approvalReq = await legStep.approvalRequirement(ctx);
        if (approvalReq) {
            const key = approvalKey({
                chainId: legStep.chainId,
                token: legStep.mint,
                spender: approvalReq.spender,
            });
            if (!seenApprovals.has(key)) {
                // Add approval step
                ordered.push(
                    new ApproveStep(
                        legStep.chainId,
                        legStep.mint,
                        approvalReq.amount,
                        approvalReq.spender,
                    ),
                );
                seenApprovals.add(key);
            }
        }

        // Add the leg itself
        ordered.push(legStep);
    }

    return ordered;
}
