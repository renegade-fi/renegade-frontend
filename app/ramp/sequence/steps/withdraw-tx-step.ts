import type { StepExecutionContext } from "../models";
import { BaseStep } from "../models";

export class WithdrawTxStep extends BaseStep {
    constructor(chainId: number, mint: `0x${string}`, amount: bigint) {
        super(crypto.randomUUID(), "WITHDRAW", chainId, mint, amount);
    }

    async run(ctx: StepExecutionContext): Promise<void> {
        await this.ensureCorrectChain(ctx);
        // TODO: implement Renegade withdraw logic
        console.warn("WithdrawTxStep.run() not implemented; marking confirmed for now");
        this.status = "CONFIRMED";
    }
}
