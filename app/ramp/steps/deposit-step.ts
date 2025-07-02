import { getSDKConfig } from "@renegade-fi/react";
import { deposit } from "@renegade-fi/react/actions";
import { resolveAddress } from "@/lib/token";
import type { StepExecutionContext } from "../types";
import { BaseStep } from "./base-step";

/**
 * Renegade deposit step requiring Permit2 signature.
 *
 * Deposits tokens into the Renegade darkpool using a signed permit.
 */
export class DepositStep extends BaseStep {
    static override needsPermit2 = true;

    constructor(chainId: number, mint: `0x${string}`, amount: bigint) {
        super(crypto.randomUUID(), "DEPOSIT", chainId, mint, amount);
    }

    override async approvalRequirement() {
        const cfg = getSDKConfig(this.chainId);
        return { spender: cfg.permit2Address as `0x${string}`, amount: this.amount };
    }

    async run(ctx: StepExecutionContext): Promise<void> {
        await this.ensureCorrectChain(ctx);

        const token = resolveAddress(this.mint);

        if (!ctx.permit || !ctx.permit.nonce || !ctx.permit.deadline || !ctx.permit.signature) {
            throw new Error("Permit is not set");
        }

        const owner = ctx.getWagmiAddress();

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
        this.status = "CONFIRMED";
    }
}
