import type { StepExecutionContext } from "../types";
import { BaseStep } from "./base-step";

export class WithdrawStep extends BaseStep {
    constructor(chainId: number, mint: `0x${string}`, amount: bigint) {
        super(crypto.randomUUID(), "WITHDRAW", chainId, mint, amount);
    }

    async run(ctx: StepExecutionContext): Promise<void> {
        await this.ensureCorrectChain(ctx);
        // TODO: implement Renegade withdraw logic
        console.warn("WithdrawStep.run() not implemented; marking confirmed for now");
        this.status = "CONFIRMED";
    }
}
