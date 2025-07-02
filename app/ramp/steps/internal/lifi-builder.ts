import type { Route } from "@lifi/sdk";
import { zeroAddress } from "@/lib/token";
import type { Step } from "../../types";
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

// Helper to determine if a token address represents native ETH (no allowance possible)
const LIFI_NATIVE_ETH_SENTINEL = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee" as `0x${string}`;
function isNativeEth(mint: `0x${string}`): boolean {
    const lower = mint.toLowerCase();
    return lower === zeroAddress.toLowerCase() || lower === LIFI_NATIVE_ETH_SENTINEL;
}

/**
 * Builds an ordered list of prerequisite ApproveSteps and LiFiLegSteps
 * for every leg in a LI.FI route. Duplicate approvals are deduplicated.
 */
export async function buildStepsFromLiFiRoute(route: Route): Promise<Step[]> {
    const ordered: Step[] = [];

    // Track approvals already added to avoid duplicates across legs.
    const seenApprovals = new Set<string>();

    for (const leg of route.steps ?? []) {
        const legStep = new LiFiLegStep(leg);

        // Determine approval requirement
        const approvalReq = await legStep.approvalRequirement();
        if (approvalReq && !isNativeEth(legStep.mint)) {
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
