import { getSDKConfig } from "@renegade-fi/react";
import { deposit } from "@renegade-fi/react/actions";
import { resolveAddress } from "@/lib/token";
import { Prereq, type StepExecutionContext } from "../types";
import { BaseStep } from "./base-step";

/**
 * Renegade deposit step requiring Permit2 signature.
 *
 * Deposits tokens into the Renegade darkpool using a signed permit.
 */
export class DepositStep extends BaseStep {
    static override prereqs = [Prereq.APPROVAL, Prereq.PERMIT2];

    constructor(chainId: number, mint: `0x${string}`, amount: bigint) {
        super(crypto.randomUUID(), "DEPOSIT", chainId, mint, amount, "renegade");
    }

    override async approvalRequirement() {
        const cfg = getSDKConfig(this.chainId);
        // Approve a large allowance to avoid insufficiency if the final received amount exceeds expectation
        const maxUint256 = BigInt(2) ** BigInt(256) - BigInt(1);
        return { spender: cfg.permit2Address as `0x${string}`, amount: maxUint256 };
    }

    async run(ctx: StepExecutionContext): Promise<void> {
        // Update amount from LiFi result if available
        if (ctx.data.lifiFinalAmount) {
            this.amount = ctx.data.lifiFinalAmount;
        }

        await this.ensureCorrectChain(ctx);

        const token = resolveAddress(this.mint);

        if (!ctx.permit || !ctx.permit.nonce || !ctx.permit.deadline || !ctx.permit.signature) {
            throw new Error("Permit is not set");
        }

        const owner = ctx.getOnchainAddress(this.chainId) as `0x${string}`;

        // Call deposit action
        const { taskId } = await deposit(ctx.renegadeConfig, {
            fromAddr: owner,
            mint: token.address,
            amount: this.amount,
            permitNonce: ctx.permit.nonce,
            permitDeadline: ctx.permit.deadline,
            permit: ctx.permit.signature,
        });

        this.taskId = taskId;

        await this.awaitCompletion(ctx);
    }
}
