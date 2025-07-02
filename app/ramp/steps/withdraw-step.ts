import { withdraw } from "@renegade-fi/react/actions";
import { resolveAddress } from "@/lib/token";
import type { StepExecutionContext } from "../types";
import { BaseStep } from "./base-step";
import { Prereq } from "./prereq-types";

/**
 * Renegade withdrawal step.
 *
 * Withdraws tokens from the Renegade darkpool to a user's wallet.
 */
export class WithdrawStep extends BaseStep {
    static override prereqs = [Prereq.PAY_FEES];

    constructor(chainId: number, mint: `0x${string}`, amount: bigint) {
        super(crypto.randomUUID(), "WITHDRAW", chainId, mint, amount);
    }

    async run(ctx: StepExecutionContext): Promise<void> {
        await this.ensureCorrectChain(ctx);

        const owner = ctx.getWagmiAddress();
        if (!owner) throw new Error("Wallet account not found");

        const token = resolveAddress(this.mint);

        const { taskId } = await withdraw(ctx.renegadeConfig, {
            mint: token.address,
            amount: this.amount,
            destinationAddr: owner,
        });

        this.taskId = taskId;
        this.status = "CONFIRMED";
    }
}
