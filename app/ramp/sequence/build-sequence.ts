import { erc20Abi } from "@/lib/generated";
import type { BaseStep, SequenceIntent, Step, StepExecutionContext } from "./models";
import { ApproveStep } from "./steps/approve-step";
import { BridgeTxStep } from "./steps/bridge-tx-step";
import { DepositTxStep } from "./steps/deposit-tx-step";
import { Permit2SigStep } from "./steps/permit2-sig-step";
import { SwapTxStep } from "./steps/swap-tx-step";
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
    const tokenOn = (ticker: string, chainId: number): `0x${string}` => {
        try {
            const meta = getTokenMeta(ticker, chainId);
            return (meta.address ?? "0x0000000000000000000000000000000000000000") as `0x${string}`;
        } catch {
            return "0x0000000000000000000000000000000000000000";
        }
    };

    const coreSteps: Step[] = [];

    // ---------------- Build core steps (no approval/permit yet) ----------------
    if (intent.kind === "SWAP") {
        // 1. Swap on the source chain
        const fromAddress = tokenOn(intent.fromTicker!, intent.fromChain);
        const toAddress = tokenOn(intent.toTicker, intent.toChain);
        coreSteps.push(
            new SwapTxStep(
                intent.fromChain,
                intent.toChain,
                fromAddress,
                toAddress,
                intent.amountAtomic,
            ),
        );
        // 2. Always deposit the swapped token on the destination chain
        coreSteps.push(new DepositTxStep(intent.toChain, toAddress, intent.amountAtomic));
    } else if (intent.kind === "DEPOSIT") {
        // Optional bridge if source and destination chains differ
        if (intent.fromChain !== intent.toChain) {
            coreSteps.push(
                new BridgeTxStep(
                    intent.fromChain,
                    intent.toChain,
                    tokenOn(intent.toTicker, intent.fromChain),
                    tokenOn(intent.toTicker, intent.toChain),
                    intent.amountAtomic,
                ),
            );
        }
        // Final deposit on the destination chain
        coreSteps.push(
            new DepositTxStep(
                intent.toChain,
                tokenOn(intent.toTicker, intent.toChain),
                intent.amountAtomic,
            ),
        );
    } else {
        // WITHDRAW – never combined with bridges per spec
        coreSteps.push(
            new WithdrawTxStep(
                intent.fromChain,
                tokenOn(intent.toTicker, intent.fromChain),
                intent.amountAtomic,
            ),
        );
    }

    // ---------------- Insert prerequisite steps ----------------
    const ordered: Step[] = [];
    for (const step of coreSteps) {
        // ---------- Allowance requirement (instance-based) ----------
        try {
            const approvalReq = await step.approvalRequirement(ctx);
            if (approvalReq) {
                let needsApprove = true;
                const owner = ctx.getWagmiAddress();
                if (owner) {
                    try {
                        const pc = ctx.getPublicClient(step.chainId);

                        const allowance: bigint = await pc.readContract({
                            abi: erc20Abi,
                            address: step.mint,
                            functionName: "allowance",
                            args: [owner, approvalReq.spender],
                        });

                        needsApprove = allowance < approvalReq.amount;
                    } catch {
                        // If allowance check fails, treat as insufficient (conservative)
                        needsApprove = true;
                    }
                }

                if (needsApprove) {
                    ordered.push(
                        new ApproveStep(
                            step.chainId,
                            step.mint,
                            approvalReq.amount,
                            approvalReq.spender,
                        ),
                    );
                }
            }
        } catch {
            // Ignore approvalRequirement errors; proceed conservatively without inserting approve step.
        }

        // ---------- Permit2 requirement ----------
        const ctor = step.constructor as typeof BaseStep;
        if (ctor.needsPermit2) {
            ordered.push(new Permit2SigStep(step.chainId, step.mint, step.amount));
        }

        // Finally, the original step
        ordered.push(step);
    }

    return ordered;
}
