import { erc20Abi } from "@/lib/generated";
import type { BaseStep, SequenceIntent, Step, StepExecutionContext } from "./models";
import { ApproveStep } from "./steps/approve-step";
import { BridgeTxStep } from "./steps/bridge-tx-step";
import { DepositTxStep } from "./steps/deposit-tx-step";
import { Permit2SigStep } from "./steps/permit2-sig-step";
import { WithdrawTxStep } from "./steps/withdraw-tx-step";
import { getTokenMeta } from "./token-registry";

/**
 * Builds an ordered list of Step instances for the given intent.
 * Performs on-chain allowance checks and only inserts an APPROVE step when
 * the existing allowance for the spender is insufficient.
 */
export async function buildSequence(
    intent: SequenceIntent,
    ctx: StepExecutionContext,
): Promise<Step[]> {
    // Helper to fetch token address on chain; falls back to zero.
    const tokenOn = (chainId: number): `0x${string}` => {
        try {
            const meta = getTokenMeta(intent.tokenTicker, chainId);
            return (meta.address ?? "0x0000000000000000000000000000000000000000") as `0x${string}`;
        } catch {
            return "0x0000000000000000000000000000000000000000";
        }
    };

    const coreSteps: Step[] = [];

    // Bridging path
    if (intent.fromChain !== intent.toChain) {
        // Bridge token on fromChain
        coreSteps.push(
            new BridgeTxStep(intent.fromChain, tokenOn(intent.fromChain), intent.amountAtomic),
        );
    }

    // Final action
    if (intent.kind === "DEPOSIT") {
        coreSteps.push(
            new DepositTxStep(intent.toChain, tokenOn(intent.toChain), intent.amountAtomic),
        );
    } else {
        coreSteps.push(
            new WithdrawTxStep(intent.toChain, tokenOn(intent.toChain), intent.amountAtomic),
        );
    }

    // ---------------- Insert prerequisite steps ----------------
    const ordered: Step[] = [];
    for (const step of coreSteps) {
        const ctor = step.constructor as typeof BaseStep;

        // Approval requirement (allowance-aware)
        if (ctor.needsApproval) {
            const approvalInfo = ctor.needsApproval(step.chainId, step.mint);
            if (approvalInfo) {
                let needsApprove = true; // default to true until proven sufficient
                try {
                    const owner = ctx.walletClient.account?.address;
                    if (owner && ctx.publicClient.chain?.id === step.chainId) {
                        const allowance: bigint = await ctx.publicClient.readContract({
                            abi: erc20Abi,
                            address: step.mint,
                            functionName: "allowance",
                            args: [owner, approvalInfo.spender],
                        });
                        needsApprove = allowance < step.amount;
                    }
                } catch {
                    // If allowance check fails, keep needsApprove = true (conservative)
                }

                if (needsApprove) {
                    ordered.push(
                        new ApproveStep(step.chainId, step.mint, step.amount, approvalInfo.spender),
                    );
                }
            }
        }

        // Permit2 requirement
        if (ctor.needsPermit2) {
            ordered.push(new Permit2SigStep(step.chainId, step.mint, step.amount));
        }

        // Finally, the original step
        ordered.push(step);
    }

    return ordered;
}
